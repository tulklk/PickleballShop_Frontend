/**
 * Chỉ chấp nhận URL http(s) tuyệt đối. Trả về null cho `javascript:`, `data:`, `vbscript:`, ...
 */
export function safeHttpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
    return null;
  } catch {
    return null;
  }
}

/**
 * Chỉ chấp nhận đường dẫn nội bộ (bắt đầu bằng một dấu "/"), chống open redirect.
 * Từ chối: "//evil.com", "/\\evil.com", "https://evil.com", "javascript:...", ký tự điều khiển.
 */
export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/"
): string {
  if (!value) return fallback;
  const v = value.trim();
  if (!v.startsWith("/")) return fallback;
  if (v.startsWith("//") || v.startsWith("/\\")) return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\\]/.test(v)) return fallback;
  return v;
}

/**
 * Đường dẫn sau đăng nhập: dùng `?redirect=` nếu là đường dẫn nội bộ hợp lệ, ngược lại dùng `fallback`.
 * (Các trang khác đã gửi người dùng tới `/login?redirect=...`.)
 */
export function resolvePostLoginPath(search: string, fallback: string): string {
  const target = new URLSearchParams(search).get("redirect");
  return safeInternalPath(target, fallback);
}

/**
 * Điều hướng tới cổng thanh toán do backend trả về. Chỉ cho phép https (tránh `javascript:`/`data:`
 * nếu response bị can thiệp hoặc backend lỗi).
 */
export function navigateToPayment(url: string | null | undefined): void {
  const safe = safeHttpUrl(url);
  if (!safe || !safe.startsWith("https://")) {
    throw new Error("Liên kết thanh toán không hợp lệ. Vui lòng thử lại hoặc liên hệ hỗ trợ.");
  }
  window.location.assign(safe);
}

/** Mở link ngoài an toàn (noopener + noreferrer) và chỉ với URL http(s). */
export function openExternal(url: string | null | undefined): void {
  const safe = safeHttpUrl(url);
  if (!safe || typeof window === "undefined") return;
  window.open(safe, "_blank", "noopener,noreferrer");
}
