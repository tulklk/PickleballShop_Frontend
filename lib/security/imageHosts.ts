import { safeHttpUrl } from "./safeUrl";

/**
 * Chỉ coi là ảnh Cloudinary hợp lệ nếu hostname THỰC SỰ là res.cloudinary.com
 * (không dùng `includes("cloudinary.com")` vì có thể bị bypass bằng https://evil.com/?cloudinary.com).
 */
export function safeCloudinaryUrl(value: string | null | undefined): string | null {
  const safe = safeHttpUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  if (url.protocol !== "https:") return null;
  return url.hostname === "res.cloudinary.com" ? safe : null;
}
