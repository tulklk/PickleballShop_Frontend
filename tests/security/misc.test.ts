import { describe, expect, it, beforeEach } from "vitest";
import { detectImageType } from "@/lib/security/imageSignature";
import { rateLimit, __resetRateLimitForTests } from "@/lib/security/rateLimit";
import { safeJsonLd } from "@/lib/security/jsonLd";
import { splitChatBold } from "@/lib/utils/chatFormat";
import {
  derivePayosHint,
  isPaidPaymentStatus,
  isValidOrderId,
} from "@/lib/utils/paymentStatus";
import { sanitizeGuestCart } from "@/lib/utils/guestCart";

const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);

describe("detectImageType (magic bytes)", () => {
  it("nhận diện PNG/JPEG/GIF/WEBP thật", () => {
    expect(detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))?.ext).toBe("png");
    expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))?.ext).toBe("jpg");
    expect(detectImageType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))?.ext).toBe("gif");
    const webp = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0, 0, 0, 0]);
    expect(detectImageType(webp)?.ext).toBe("webp");
  });
  it("từ chối SVG, HTML, exe, file rỗng", () => {
    const enc = (s: string) => new TextEncoder().encode(s.padEnd(32, " "));
    expect(detectImageType(enc('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'))).toBeNull();
    expect(detectImageType(enc("<html><script>alert(1)</script></html>"))).toBeNull();
    expect(detectImageType(bytes(0x4d, 0x5a, 0x90, 0x00))).toBeNull(); // MZ (exe)
    expect(detectImageType(new Uint8Array(0))).toBeNull();
  });
});

describe("rateLimit", () => {
  beforeEach(() => __resetRateLimitForTests());
  it("chặn khi vượt ngưỡng và mở lại sau cửa sổ", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) expect(rateLimit("k", 3, 1000, t0).allowed).toBe(true);
    const blocked = rateLimit("k", 3, 1000, t0 + 10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(rateLimit("k", 3, 1000, t0 + 1001).allowed).toBe(true);
  });
  it("key khác nhau không ảnh hưởng nhau", () => {
    const t0 = 5;
    rateLimit("a", 1, 1000, t0);
    expect(rateLimit("a", 1, 1000, t0).allowed).toBe(false);
    expect(rateLimit("b", 1, 1000, t0).allowed).toBe(true);
  });
});

describe("safeJsonLd (script breakout)", () => {
  it("không để lại ký tự < > & thô", () => {
    const out = safeJsonLd({ name: '</script><script>alert(1)</script>' });
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>');
  });
});

describe("splitChatBold (không sinh HTML)", () => {
  it("tách bold và giữ nguyên HTML như văn bản thuần", () => {
    const segs = splitChatBold('xin **chào** <img src=x onerror=alert(1)>');
    expect(segs).toEqual([
      { bold: false, text: "xin " },
      { bold: true, text: "chào" },
      { bold: false, text: " <img src=x onerror=alert(1)>" },
    ]);
  });
});

describe("payment return helpers", () => {
  it("isValidOrderId chỉ nhận UUID", () => {
    expect(isValidOrderId("3f2504e0-4f89-11d3-9a0c-0305e82c3301")).toBe(true);
    expect(isValidOrderId("../../admin")).toBe(false);
    expect(isValidOrderId("1; DROP TABLE")).toBe(false);
    expect(isValidOrderId("")).toBe(false);
  });
  it("query string chỉ là hint; trạng thái paid phải đến từ backend", () => {
    const p = (q: string) => new URLSearchParams(q);
    expect(derivePayosHint(p("status=PAID&code=00"))).toBe("success");
    expect(derivePayosHint(p("cancel=true"))).toBe("cancelled");
    expect(derivePayosHint(p("code=99"))).toBe("failed");
    expect(derivePayosHint(p(""))).toBe("unknown");
    expect(isPaidPaymentStatus("Completed")).toBe(true);
    expect(isPaidPaymentStatus(3)).toBe(true);
    expect(isPaidPaymentStatus("Pending")).toBe(false);
    expect(isPaidPaymentStatus(null)).toBe(false);
  });
});

describe("sanitizeGuestCart (localStorage tampering)", () => {
  it("loại bỏ dòng không hợp lệ và clamp số lượng", () => {
    const out = sanitizeGuestCart([
      { productId: "abc-123", quantity: 2, unitPrice: 100 },
      { productId: "abc-123", quantity: -5 },
      { productId: "abc-123", quantity: 1.5 },
      { productId: "<script>", quantity: 1 },
      { productId: "ok-1", quantity: 10_000_000, unitPrice: -1 },
      null,
      "x",
    ]);
    expect(out.map((i) => i.productId)).toEqual(["abc-123", "ok-1"]);
    expect(out[1].quantity).toBe(100);
    expect(out[1].unitPrice).toBeUndefined();
  });
  it("không phải mảng => rỗng", () => {
    expect(sanitizeGuestCart({ a: 1 })).toEqual([]);
  });
});
