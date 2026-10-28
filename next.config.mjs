import { securityHeaders, noStoreHeaders, noStoreSources } from "./security-headers.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Không lộ header "X-Powered-By: Next.js"
  poweredByHeader: false,
  serverExternalPackages: ["sharp"],
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },

  // Không public source map ở production; xoá mọi console.* trong bundle production
  // (tránh lộ token/mật khẩu/PII qua log trình duyệt).
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Build Vercel: không fail vì ESLint chưa cấu hình đầy đủ — vẫn kiểm tra TypeScript
  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config) => {
    // Các dòng <w> PackFileCacheStrategy / "Managed item" là log NỘI BỘ Webpack khi quét optional
    // native deps (@next/swc-*, @img/sharp-*, @tailwindcss/oxide-*, lightningcss-* cho OS khác).
    // Không phải lỗi app — ignoreWarnings không áp dụng cho log đó; cần hạ mức infrastructure log.
    config.infrastructureLogging = {
      ...config.infrastructureLogging,
      level: "error",
    };

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      (warning) => {
        const msg = String(warning?.message ?? warning ?? "");
        return (
          /Managed item.*node_modules[\\/](@img|@next|@tailwindcss)/i.test(msg) ||
          (/Managed item/i.test(msg) && /lightningcss-/i.test(msg)) ||
          (/PackFileCacheStrategy/i.test(msg) && /Managed item/i.test(msg))
        );
      },
    ];

    return config;
  },

  // public/favicon.ico từng là PNG đổi tên — Next có thể trả 500 khi xử lý .ico.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.png" }];
  },
  // Header bảo mật tĩnh (CSP có nonce nằm trong middleware.ts).
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Dữ liệu cá nhân/phiên không được cache bởi CDN/proxy dùng chung.
      ...noStoreSources.map((source) => ({ source, headers: noStoreHeaders })),
    ];
  },
  images: {
    // Chỉ cho phép ảnh từ nguồn của shop (Cloudinary của shop + backend). Đã bỏ via.placeholder.com (không dùng).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pickleballshop-backend.fly.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          ? `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/**`
          : "/**",
      },
    ],
  },
};

export default nextConfig;
