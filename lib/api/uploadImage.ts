import { apiClient } from "@/lib/api/client";

/**
 * Upload ảnh qua route handler `/api/upload`.
 * Route này yêu cầu Bearer token hợp lệ (được xác thực với backend) và chỉ chấp nhận
 * các thư mục nằm trong allowlist phía server.
 */
export async function uploadImage(
  file: File,
  folder: string,
  signal?: AbortSignal
): Promise<{ url: string; publicId?: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const token = apiClient.getAccessToken();
  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    signal,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    let message = "Lỗi khi upload ảnh";
    try {
      const data = await response.json();
      if (data && typeof data.error === "string") message = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const data = await response.json();
  if (!data || typeof data.url !== "string") {
    throw new Error("Phản hồi upload không hợp lệ");
  }
  return data;
}
