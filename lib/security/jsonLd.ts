/**
 * Serialize dữ liệu cho <script type="application/ld+json">.
 * JSON.stringify không escape "<" nên chuỗi chứa "</script>" có thể thoát khỏi thẻ script => XSS.
 * Escape các ký tự nguy hiểm sang \uXXXX (vẫn là JSON hợp lệ, parser đọc đúng giá trị gốc).
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
