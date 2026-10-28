/** "unknown": URL không có thông tin rõ ràng — vẫn phải hỏi backend (có thể webhook chưa tới). */
export type PaymentHint = "success" | "cancelled" | "failed" | "unknown";

type ParamsLike = { get(name: string): string | null };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** orderId từ query/sessionStorage chỉ được dùng nếu đúng định dạng UUID (tránh chèn path lạ vào router.push). */
export function isValidOrderId(value: string | null | undefined): value is string {
  return !!value && UUID_RE.test(value.trim());
}

/**
 * Gợi ý trạng thái từ query string của PayOS.
 * CHÚ Ý: query string do trình duyệt cung cấp nên KHÔNG đáng tin (bất kỳ ai cũng có thể tự gõ
 * `?status=PAID`). Kết quả này chỉ là "hint"; trạng thái thanh toán thật phải được xác nhận
 * bằng `POST /api/payments/payos/confirm` (backend đối chiếu với PayOS / webhook đã verify chữ ký).
 */
export function derivePayosHint(params: ParamsLike): PaymentHint {
  const code = params.get("code") || "";
  const statusParam = params.get("status") || "";
  const paymentStatus = (params.get("paymentStatus") || statusParam || "").toUpperCase();
  const cancel = params.get("cancel");

  const isSuccess =
    (code === "00" && statusParam === "PAID") ||
    (code === "00" && paymentStatus === "SUCCESS") ||
    paymentStatus === "SUCCESS" ||
    paymentStatus === "PAID" ||
    statusParam.toUpperCase() === "PAID";

  if (isSuccess) return "success";

  const isCancelled =
    cancel === "true" || statusParam === "CANCELLED" || paymentStatus === "CANCELLED";
  if (isCancelled) return "cancelled";

  // Có mã lỗi tường minh từ PayOS (code khác "00") => thất bại; ngược lại không đủ thông tin.
  if (code && code !== "00") return "failed";
  return "unknown";
}

/** Backend trả paymentStatus dạng chuỗi hoặc số; coi các giá trị "đã thanh toán" là hợp lệ. */
export function isPaidPaymentStatus(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  const s = String(value).toLowerCase();
  // PaymentStatus.Completed = 3 (xem lib/api/types.ts)
  return s === "paid" || s === "completed" || s === "success" || s === "succeeded" || s === "3";
}
