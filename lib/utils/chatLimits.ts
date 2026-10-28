import type { ChatMessage } from "@/lib/api/types";

export const CHAT_MESSAGE_MAX = 1000;
export const CHAT_HISTORY_MAX_ITEMS = 50;
export const CHAT_ROLE_MAX = 20;
export const CHAT_HISTORY_CONTENT_MAX = 4000;

/** Cắt tin nhắn người dùng về tối đa 1000 ký tự. */
export function clampChatMessage(message: string): string {
  return message.slice(0, CHAT_MESSAGE_MAX);
}

/**
 * Chuẩn hoá lịch sử hội thoại theo giới hạn của backend:
 * tối đa 50 phần tử (giữ các phần tử mới nhất), role <= 20, content <= 4000 ký tự.
 */
export function sanitizeChatHistory(history: ChatMessage[]): ChatMessage[] {
  return history
    .filter((m) => m && typeof m.content === "string" && m.content.length > 0)
    .slice(-CHAT_HISTORY_MAX_ITEMS)
    .map((m) => ({
      role: String(m.role).slice(0, CHAT_ROLE_MAX) as ChatMessage["role"],
      content: m.content.slice(0, CHAT_HISTORY_CONTENT_MAX),
    }));
}
