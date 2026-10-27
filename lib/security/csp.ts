/**
 * Xây dựng Content-Security-Policy (CSP) theo từng request với nonce.
 *
 * Quyết định thiết kế:
 * - script-src dùng nonce + 'strict-dynamic' (KHÔNG 'unsafe-inline', KHÔNG 'unsafe-eval' ở production).
 *   'unsafe-eval' chỉ bật ở dev vì React dev tooling cần.
 * - style-src giữ 'unsafe-inline' vì Tailwind/Radix/Sonner/Next sinh inline style attribute; rủi ro của
 *   inline style thấp hơn nhiều so với inline script và không thể nonce cho style attribute.
 * - img-src cho phép https: vì ảnh sản phẩm/avatar có thể đến từ nhiều host (Cloudinary, Google, ui-avatars).
 *   Ảnh không thực thi mã; script/connect/frame được siết chặt riêng.
 */
export type CspOptions = {
  nonce: string;
  isDev?: boolean;
  /** Base URL của backend API, ví dụ https://pickleballshop-backend.fly.dev */
  apiBaseUrl?: string;
};

function originOf(url: string | undefined): { https: string; wss: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.host;
    return {
      https: `${u.protocol}//${host}`,
      wss: `${u.protocol === "https:" ? "wss:" : "ws:"}//${host}`,
    };
  } catch {
    return null;
  }
}

export function buildCsp({ nonce, isDev = false, apiBaseUrl }: CspOptions): string {
  const api = originOf(apiBaseUrl);

  const connectSrc = [
    "'self'",
    "https://accounts.google.com",
    "https://provinces.open-api.vn",
    ...(api ? [api.https, api.wss] : []),
    ...(isDev ? ["ws://localhost:*", "http://localhost:*"] : []),
  ];

  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    ...(isDev ? ["'unsafe-eval'"] : []),
  ];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": scriptSrc,
    "style-src": ["'self'", "'unsafe-inline'", "https://accounts.google.com/gsi/style"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": connectSrc,
    "frame-src": ["https://accounts.google.com"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
  };

  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(" ")}`);
  if (!isDev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}
