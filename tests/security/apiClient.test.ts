// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient, ApiError, SESSION_EXPIRED_EVENT } from "@/lib/api/client";

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

describe("apiClient (mock fetch)", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    localStorage.clear();
    apiClient.setAccessToken(null);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("refresh token xoay vòng: lưu cả access và refresh token mới", async () => {
    apiClient.setRefreshToken("old-refresh");
    fetchMock.mockResolvedValueOnce(json({ accessToken: "new-access", refreshToken: "new-refresh" }));
    expect(await apiClient.refreshSession()).toBe(true);
    expect(apiClient.getAccessToken()).toBe("new-access");
    expect(apiClient.getRefreshToken()).toBe("new-refresh");
  });

  it("refresh single-flight: nhiều lời gọi đồng thời chỉ gọi mạng 1 lần", async () => {
    apiClient.setRefreshToken("r1");
    fetchMock.mockImplementation(async () => json({ accessToken: "a2", refreshToken: "r2" }));
    const results = await Promise.all([apiClient.refreshSession(), apiClient.refreshSession(), apiClient.refreshSession()]);
    expect(results).toEqual([true, true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refresh 401 => xóa phiên và phát SESSION_EXPIRED_EVENT", async () => {
    apiClient.setAccessToken("a");
    apiClient.setRefreshToken("r");
    const listener = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, listener);
    fetchMock.mockResolvedValueOnce(json({ message: "invalid" }, 401));
    expect(await apiClient.refreshSession()).toBe(false);
    expect(apiClient.getAccessToken()).toBeNull();
    expect(apiClient.getRefreshToken()).toBeNull();
    expect(listener).toHaveBeenCalled();
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener);
  });

  it("429 => ApiError có retryAfterSeconds và thông báo thân thiện", async () => {
    fetchMock.mockResolvedValueOnce(json({}, 429, { "Retry-After": "12" }));
    const err = await apiClient.getProducts().catch((e) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(429);
    expect(err.retryAfterSeconds).toBe(12);
    expect(err.statusText).toMatch(/12/);
  });

  it("guest lookup dùng /api/guest-orders/lookup với email + orderNumber", async () => {
    fetchMock.mockResolvedValueOnce(json([{ id: "1" }]));
    await apiClient.lookupGuestOrder({ email: "a@b.co", orderNumber: "ORD-1" });
    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/api/guest-orders/lookup");
    expect(url).toContain("email=a%40b.co");
    expect(url).toContain("orderNumber=ORD-1");
  });

  it("tạo đơn guest gửi payload không có giá và đúng đường dẫn", async () => {
    fetchMock.mockResolvedValueOnce(json({ id: "1" }));
    await apiClient.createGuestOrder({
      email: "a@b.co",
      fullName: "A",
      shippingAddress: {
        fullName: "A",
        phoneNumber: "0901234567",
        addressLine: "x",
        ward: "w",
        district: "d",
        city: "c",
      },
      paymentMethod: 1,
      items: [{ productId: "p1", quantity: 1, unitPrice: 9 } as never],
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/guest-orders");
    expect(String(init.body)).not.toMatch(/unitPrice|price|total/i);
  });

  it("voucher: user chỉ gửi {code}; guest gửi {email, code, items}", async () => {
    fetchMock.mockImplementation(async () => json({ valid: true }));
    await apiClient.applyVoucherForUser({ code: "SALE" });
    expect(String(fetchMock.mock.calls[0][0]).toLowerCase()).toContain("/api/orders/apply-voucher");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ code: "SALE" });

    await apiClient.applyVoucherForGuest({
      email: "a@b.co",
      code: "SALE",
      items: [{ productId: "p", quantity: 1, unitPrice: 5 } as never],
    });
    expect(String(fetchMock.mock.calls[1][0])).toContain("/api/guest-orders/apply-voucher");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      email: "a@b.co",
      code: "SALE",
      items: [{ productId: "p", quantity: 1 }],
    });
  });

  it("PayOS confirm gọi POST /api/payments/payos/confirm với orderCode số", async () => {
    fetchMock.mockResolvedValueOnce(json({ success: true }));
    await apiClient.confirmPayosPayment({ orderCode: 123 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/api/payments/payos/confirm");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body).orderCode).toBe(123);
  });

  it("getProducts chặn PageSize tối đa 100", async () => {
    fetchMock.mockResolvedValueOnce(json({ items: [], totalCount: 0, page: 1, pageSize: 100, totalPages: 1 }));
    await apiClient.getProducts({ Page: 1, PageSize: 1000 });
    expect(String(fetchMock.mock.calls[0][0])).toContain("PageSize=100");
  });
});
