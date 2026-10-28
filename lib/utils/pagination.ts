/** Backend giới hạn pageSize tối đa 100 cho mọi endpoint phân trang. */
export const MAX_PAGE_SIZE = 100;

export function clampPageSize(value: number): number {
  if (!Number.isFinite(value)) return MAX_PAGE_SIZE;
  return Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(value)));
}

/** Chuẩn hoá giá trị query: chỉ tham số PageSize/pageSize bị chặn trên 100. */
export function normalizeQueryValue(key: string, value: unknown): string {
  if (key.toLowerCase() === "pagesize") {
    const n = Number(value);
    if (Number.isFinite(n)) return String(clampPageSize(n));
  }
  return String(value);
}
