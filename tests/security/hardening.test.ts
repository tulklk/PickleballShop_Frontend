import { describe, it, expect, vi } from "vitest";
import { validatePassword, isCommonPassword } from "@/lib/validation/password";
import { parseRetryAfter } from "@/lib/api/client";
import {
  sanitizeOrderItems,
  sanitizeGuestOrderPayload,
  validateGuestOrder,
  clampQuantity,
  isValidPhone,
  MAX_ORDER_LINES,
} from "@/lib/utils/orderPayload";
import { confirmPayosWithRetry, parseOrderCode } from "@/lib/utils/payosConfirm";
import { clampChatMessage, sanitizeChatHistory } from "@/lib/utils/chatLimits";
import { normalizeQueryValue, clampPageSize } from "@/lib/utils/pagination";
import type { CreateGuestOrderRequest } from "@/lib/api/types";

describe("password validator", () => {
  it("chấp nhận mật khẩu hợp lệ", () => {
    expect(validatePassword("Sup3rSecret!")).toBeNull();
  });
  it("từ chối ngắn, thiếu chữ, thiếu số, quá dài", () => {
    expect(validatePassword("Ab1")).toMatch(/ít nhất 8/);
    expect(validatePassword("12345678901")).toMatch(/chữ cái/);
    expect(validatePassword("abcdefghijk")).toMatch(/chữ số/);
    expect(validatePassword("a1".repeat(70))).toMatch(/tối đa 128/);
  });
  it("từ chối mật khẩu phổ biến", () => {
    expect(isCommonPassword("Admin@123")).toBe(true);
    expect(validatePassword("Password123")).toMatch(/phổ biến/);
  });
});

describe("parseRetryAfter", () => {
  it("đọc số giây và clamp 1..3600", () => {
    expect(parseRetryAfter("30")).toBe(30);
    expect(parseRetryAfter("0")).toBe(1);
    expect(parseRetryAfter("999999")).toBe(3600);
  });
  it("đọc HTTP-date", () => {
    const now = Date.parse("2026-01-01T00:00:00Z");
    expect(parseRetryAfter("Thu, 01 Jan 2026 00:01:00 GMT", now)).toBe(60);
  });
  it("giá trị rác => undefined", () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("abc")).toBeUndefined();
  });
});

describe("guest order payload", () => {
  const base: CreateGuestOrderRequest = {
    email: "a@b.co",
    fullName: "A",
    shippingAddress: {
      fullName: "A",
      phoneNumber: "0901 234 567",
      addressLine: "1 Street",
      ward: "W",
      district: "D",
      city: "C",
    },
    paymentMethod: 1,
    items: [{ productId: "p1", quantity: 2 }],
  };

  it("sanitizeOrderItems chỉ giữ productId/variant/quantity (không giá)", () => {
    const out = sanitizeOrderItems([
      { productId: "p1", productVariantId: "v1", quantity: 2, unitPrice: 1, name: "x" } as never,
    ]);
    expect(out).toEqual([{ productId: "p1", productVariantId: "v1", quantity: 2 }]);
  });
  it("clamp số lượng 1..100 và giới hạn 50 dòng", () => {
    expect(clampQuantity(0)).toBe(1);
    expect(clampQuantity(5000)).toBe(100);
    expect(clampQuantity("abc")).toBe(1);
    const many = Array.from({ length: MAX_ORDER_LINES + 1 }, (_, i) => ({ productId: `p${i}`, quantity: 1 }));
    expect(() => sanitizeOrderItems(many)).toThrow();
  });
  it("sanitizeGuestOrderPayload không chứa trường giá", () => {
    const dirty = { ...base, totalAmount: 1, items: [{ productId: "p1", quantity: 1, unitPrice: 1 }] } as never;
    const out = sanitizeGuestOrderPayload(dirty);
    expect(JSON.stringify(out)).not.toMatch(/price|total/i);
  });
  it("validateGuestOrder bắt email/phone/quantity/paymentMethod sai", () => {
    expect(validateGuestOrder(base)).toBeNull();
    expect(validateGuestOrder({ ...base, email: "bad" })).toMatch(/Email/);
    expect(
      validateGuestOrder({ ...base, shippingAddress: { ...base.shippingAddress, phoneNumber: "abc" } })
    ).toMatch(/điện thoại/);
    expect(validateGuestOrder({ ...base, items: [{ productId: "p", quantity: 101 }] })).toMatch(/Số lượng/);
    expect(validateGuestOrder({ ...base, paymentMethod: 99 as never })).toMatch(/thanh toán/);
    expect(isValidPhone("+84 (90) 123-4567")).toBe(true);
    expect(isValidPhone("1234567")).toBe(false);
  });
});

describe("PayOS confirm", () => {
  const sleep = async () => {};
  it("parseOrderCode chỉ nhận số nguyên dương", () => {
    expect(parseOrderCode("123456")).toBe(123456);
    expect(parseOrderCode("12a")).toBeNull();
    expect(parseOrderCode("-1")).toBeNull();
    expect(parseOrderCode(null)).toBeNull();
  });
  it("success:true => success (không quan tâm hint)", async () => {
    const confirm = vi.fn().mockResolvedValue({ success: true });
    const r = await confirmPayosWithRetry({ confirm, orderCode: 1, hint: "unknown", sleep });
    expect(r.kind).toBe("success");
    expect(confirm).toHaveBeenCalledTimes(1);
  });
  it("URL nói success nhưng backend success:false => không thành công, retry có giới hạn", async () => {
    const confirm = vi.fn().mockResolvedValue({ success: false });
    const r = await confirmPayosWithRetry({ confirm, orderCode: 1, hint: "success", maxAttempts: 3, sleep });
    expect(r.kind).toBe("notPaid");
    expect(confirm).toHaveBeenCalledTimes(3);
  });
  it("403/404 dừng ngay", async () => {
    const c403 = vi.fn().mockRejectedValue({ status: 403 });
    expect((await confirmPayosWithRetry({ confirm: c403, orderCode: 1, hint: "unknown", sleep })).kind).toBe(
      "forbidden"
    );
    expect(c403).toHaveBeenCalledTimes(1);
    const c404 = vi.fn().mockRejectedValue({ status: 404 });
    expect((await confirmPayosWithRetry({ confirm: c404, orderCode: 1, hint: "unknown", sleep })).kind).toBe(
      "notFound"
    );
  });
  it("429 thử lại rồi báo rateLimited; 500 báo error; thành công sau khi retry", async () => {
    const c429 = vi.fn().mockRejectedValue({ status: 429, retryAfterSeconds: 1 });
    const r429 = await confirmPayosWithRetry({ confirm: c429, orderCode: 1, hint: "unknown", maxAttempts: 2, sleep });
    expect(r429.kind).toBe("rateLimited");
    expect(c429).toHaveBeenCalledTimes(2);

    const c500 = vi.fn().mockRejectedValue({ status: 500 });
    const r500 = await confirmPayosWithRetry({ confirm: c500, orderCode: 1, hint: "unknown", maxAttempts: 2, sleep });
    expect(r500.kind).toBe("error");

    const eventually = vi
      .fn()
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValueOnce({ success: true });
    const rOk = await confirmPayosWithRetry({ confirm: eventually, orderCode: 1, hint: "unknown", sleep });
    expect(rOk.kind).toBe("success");
  });
  it("hint cancelled => cancelled", async () => {
    const confirm = vi.fn().mockResolvedValue({ success: false });
    const r = await confirmPayosWithRetry({ confirm, orderCode: 1, hint: "cancelled", sleep });
    expect(r.kind).toBe("cancelled");
  });
});

describe("chat limits & pagination", () => {
  it("cắt tin nhắn 1000, history 50 phần tử, content 4000, role 20", () => {
    expect(clampChatMessage("x".repeat(2000))).toHaveLength(1000);
    const history = Array.from({ length: 80 }, (_, i) => ({
      role: "user" as const,
      content: `m${i}`.padEnd(5000, "x"),
    }));
    const out = sanitizeChatHistory(history);
    expect(out).toHaveLength(50);
    expect(out[0].content.length).toBe(4000);
    expect(out[49].content.startsWith("m79")).toBe(true);
  });
  it("pageSize bị chặn ở 100", () => {
    expect(clampPageSize(1000)).toBe(100);
    expect(normalizeQueryValue("PageSize", 1000)).toBe("100");
    expect(normalizeQueryValue("pageSize", 20)).toBe("20");
    expect(normalizeQueryValue("Page", 1000)).toBe("1000");
  });
});
