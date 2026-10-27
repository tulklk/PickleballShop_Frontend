export type ChatSegment = { bold: boolean; text: string };

/**
 * Tách nội dung chat thành các đoạn text/bold (**bold**) để render bằng React element.
 * Không sinh HTML => không có đường XSS dù nội dung đến từ AI/backend/người dùng.
 */
export function splitChatBold(text: string): ChatSegment[] {
  const segments: ChatSegment[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ bold: false, text: text.slice(last, m.index) });
    segments.push({ bold: true, text: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ bold: false, text: text.slice(last) });
  return segments;
}
