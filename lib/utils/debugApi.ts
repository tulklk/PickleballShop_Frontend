/**
 * Verbose debug logs (set NEXT_PUBLIC_DEBUG_API=true). Shared outside `lib/api` to avoid import cycles.
 * Chỉ hoạt động ngoài production: log API có thể chứa dữ liệu cá nhân/đơn hàng/token nên
 * không bao giờ được bật trên môi trường production dù lỡ đặt biến môi trường.
 */
export const DEBUG_API =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEBUG_API === "true";
