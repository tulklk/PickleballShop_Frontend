import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { authenticateRequest } from "@/lib/server/authenticate";
import { detectImageType } from "@/lib/security/imageSignature";
import { getClientIp, rateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
// Increase timeout for Next.js API route
export const maxDuration = 60;

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB
/** Dung sai cho phần multipart overhead. */
const MAX_REQUEST_BYTES = MAX_FILE_BYTES + 512 * 1024;

/**
 * - admin : bắt buộc đăng nhập + role Admin (do backend xác thực)
 * - user  : bắt buộc đăng nhập
 * - public: khách vãng lai được phép (form đánh giá sản phẩm cho phép guest), nhưng giới hạn IP rất chặt
 */
type FolderPolicy = "admin" | "user" | "public";

/**
 * Allowlist thư mục upload. `folder` do client gửi KHÔNG được dùng trực tiếp:
 * chỉ các giá trị dưới đây được chấp nhận và mỗi thư mục có yêu cầu quyền riêng.
 */
const FOLDER_POLICY: Record<string, FolderPolicy> = {
  "pickleball-shop/products": "admin",
  "pickleball-shop/products/description": "admin",
  "pickleball-shop/news": "admin",
  "pickleball-shop/news/thumbnails": "admin",
  "pickleball-shop/avatars": "user",
  "pickleball-shop/reviews": "public",
};
const DEFAULT_FOLDER = "pickleball-shop/products";

function json(body: Record<string, unknown>, status: number, extra?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...(extra || {}) },
  });
}

function tooMany(retryAfterSeconds: number) {
  return json({ error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." }, 429, {
    "Retry-After": String(retryAfterSeconds),
  });
}

export async function POST(request: NextRequest) {
  // 1) Giảm lạm dụng theo IP trước khi tốn tài nguyên.
  const ip = getClientIp(request.headers);
  const ipLimit = rateLimit(`upload:ip:${ip}`, 60, 60_000);
  if (!ipLimit.allowed) return tooMany(ipLimit.retryAfterSeconds);

  // 2) Từ chối sớm body quá lớn.
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ error: "Ảnh quá lớn (tối đa 5MB)." }, 413);
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    console.error("[Upload] Cloudinary is not configured");
    return json({ error: "Dịch vụ tải ảnh tạm thời không khả dụng." }, 503);
  }

  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return json({ error: "Yêu cầu không hợp lệ." }, 400);
    }
    const file = formData.get("file");
    const rawFolder = formData.get("folder");

    if (!(file instanceof File)) {
      return json({ error: "Không có file được tải lên." }, 400);
    }

    // 3) Thư mục phải nằm trong allowlist.
    const folder =
      typeof rawFolder === "string" && rawFolder.length > 0 ? rawFolder : DEFAULT_FOLDER;
    const policy = Object.prototype.hasOwnProperty.call(FOLDER_POLICY, folder)
      ? FOLDER_POLICY[folder]
      : undefined;
    if (!policy) {
      return json({ error: "Thư mục tải lên không hợp lệ." }, 400);
    }

    // 4) Authentication + authorization (server-side, xác thực với backend).
    if (policy === "public") {
      const publicLimit = rateLimit(`upload:public:${ip}`, 5, 10 * 60_000);
      if (!publicLimit.allowed) return tooMany(publicLimit.retryAfterSeconds);
    } else {
      const user = await authenticateRequest(request);
      if (!user) {
        return json({ error: "Bạn cần đăng nhập để tải ảnh lên." }, 401);
      }
      if (policy === "admin" && !user.isAdmin) {
        return json({ error: "Bạn không có quyền thực hiện thao tác này." }, 403);
      }
      const userLimit = rateLimit(
        `upload:user:${user.id}`,
        user.isAdmin ? 120 : 20,
        10 * 60_000
      );
      if (!userLimit.allowed) return tooMany(userLimit.retryAfterSeconds);
    }

    // 5) Validate kích thước + nội dung thật của file (không tin Content-Type/đuôi file).
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return json({ error: "Ảnh không hợp lệ hoặc quá lớn (tối đa 5MB)." }, 413);
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImageType(buffer);
    if (!detected) {
      return json({ error: "Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF." }, 415);
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // 6) Upload: tên file do Cloudinary sinh (không dùng tên client), không ghi đè, chỉ ảnh.
    const result = await new Promise<{ secure_url: string; public_id: string }>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: "image",
            allowed_formats: ["jpg", "png", "webp", "gif"],
            use_filename: false,
            unique_filename: true,
            overwrite: false,
            timeout: 60000,
          },
          (error, res) => {
            if (error || !res) reject(error ?? new Error("Empty upload result"));
            else resolve(res as { secure_url: string; public_id: string });
          }
        );
        uploadStream.end(buffer);
      }
    );

    return json({ url: result.secure_url, publicId: result.public_id }, 200);
  } catch (error) {
    // Log phía server (không chứa secret), trả thông báo chung cho client.
    console.error(
      "[Upload] failed:",
      error instanceof Error ? error.name : "UnknownError"
    );
    return json({ error: "Không thể tải ảnh lên. Vui lòng thử lại." }, 500);
  }
}
