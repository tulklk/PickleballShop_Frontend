/**
 * Header bảo mật tĩnh (không phụ thuộc request). CSP có nonce nằm trong middleware.ts.
 * File .mjs thuần để next.config.mjs import được và test import được.
 */
export const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Dự phòng cho trình duyệt cũ; CSP frame-ancestors là cơ chế chính chống clickjacking.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // allow-popups: cần cho đăng nhập Google (popup).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

/** Trang chứa dữ liệu cá nhân/phiên: không cho cache chia sẻ (CDN/proxy) hay lưu lại. */
export const noStoreHeaders = [
  { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
];

export const noStoreSources = [
  "/account/:path*",
  "/admin/:path*",
  "/checkout/:path*",
  "/payments/:path*",
  "/order-lookup",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/auth/:path*",
  "/api/:path*",
];
