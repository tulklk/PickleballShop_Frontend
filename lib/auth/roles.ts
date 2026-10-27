/**
 * Chuẩn hóa kiểm tra role Admin (dùng được cả client lẫn server).
 * Lưu ý: quyết định bảo mật PHẢI dựa trên role do backend xác thực (token), không phải state client.
 */
export function isAdminUser(
  user: { role?: string | number | null } | null | undefined
): boolean {
  const r = user?.role;
  if (r === null || r === undefined) return false;
  if (r === "Admin" || r === 2 || r === "2") return true;
  return String(r).toLowerCase() === "admin";
}
