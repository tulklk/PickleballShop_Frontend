/** Append "mm" to "Thông số: X" in variantInfo when X does not already end with mm */
export function formatVariantInfoWithMm(
  variantInfo: string | null | undefined
): string {
  if (!variantInfo || typeof variantInfo !== "string") return variantInfo ?? "";
  return variantInfo.replace(
    /\bThông số:\s*([^,\s]+?)(?=\s*,|\s*$)/gi,
    (_, val) => {
      const v = val.trim();
      return /mm$/i.test(v) ? `Thông số: ${v}` : `Thông số: ${v}mm`;
    }
  );
}
