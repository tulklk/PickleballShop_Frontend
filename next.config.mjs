/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 14.2: dùng experimental (tên `serverExternalPackages` chỉ từ ~14.3+)
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
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
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        protocol: "https",
        hostname: "pickleballshop-backend.fly.dev",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
