/**
 * Chèn transformation Cloudinary (f_auto, q_auto, c_limit, w_, dpr_auto) để giảm dung lượng
 * và khớp kích thước hiển thị. Không đổi URL không phải Cloudinary.
 */
export function optimizeCloudinarySrc(
  url: string | null | undefined,
  options: { maxWidth?: number; maxHeight?: number } = {}
): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed.includes("res.cloudinary.com") || !trimmed.includes("/upload/")) {
    return trimmed;
  }

  const marker = "/upload/";
  const idx = trimmed.indexOf(marker);
  if (idx === -1) return trimmed;

  const afterUpload = trimmed.slice(idx + marker.length);
  const firstSegment = afterUpload.split("/")[0] ?? "";

  // Đã có transformation (segment đầu chứa dấu phẩy giữa các biến)
  if (firstSegment.includes(",")) {
    return trimmed;
  }

  const maxW = options.maxWidth ?? 800;
  const maxH = options.maxHeight;
  const parts = ["f_auto", "q_auto", "c_limit", `w_${maxW}`];
  if (maxH != null) parts.push(`h_${maxH}`);
  parts.push("dpr_auto");
  const transform = parts.join(",");

  return `${trimmed.slice(0, idx + marker.length)}${transform}/${afterUpload}`;
}
