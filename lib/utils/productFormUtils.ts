/**
 * Coerce stock quantity to a non-negative integer for API payloads.
 * Handles NaN, undefined, null, and string inputs from number inputs (e.g. valueAsNumber when empty).
 */
export function coerceStockQuantity(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) {
    const n = Math.floor(value);
    return n < 0 ? 0 : n;
  }
  const n = parseInt(String(value ?? ""), 10);
  return Number.isNaN(n) || n < 0 ? 0 : n;
}
