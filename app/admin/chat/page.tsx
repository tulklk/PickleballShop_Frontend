"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/useAuth";
import type {
  SupportConversationDto,
  SupportConversationMessagesDto,
  SupportMessageDto,
} from "@/lib/api/types";
import { supportChatService } from "@/src/services/supportChatService";
import {
  supportChatHub,
  type ConnectionStatus,
} from "@/src/services/supportChatHub";

const mergeUniqueMessages = (
  prev: SupportMessageDto[],
  incoming: SupportMessageDto[]
) => {
  const map = new Map<string, SupportMessageDto>();
  [...prev, ...incoming].forEach((message) => {
    map.set(message.id, message);
  });
  return Array.from(map.values()).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
};

const formatTime = (value?: string | null) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function AdminSupportChatPage() {
  const { accessToken } = useAuth();
  const [conversations, setConversations] = useState<SupportConversationDto[]>([]);
  const [messagesByCustomerId, setMessagesByCustomerId] = useState<
    Record<string, SupportMessageDto[]>
  >({});
  const [activeConversationCustomerId, setActiveConversationCustomerId] = useState<
    string | null
  >(null);
  const [activeConversationMeta, setActiveConversationMeta] =
    useState<SupportConversationDto | null>(null);
  const [input, setInput] = useState("");
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const activeMessages = useMemo(() => {
    if (!activeConversationCustomerId) return [];
    return messagesByCustomerId[activeConversationCustomerId] || [];
  }, [activeConversationCustomerId, messagesByCustomerId]);

  const scrollToBottom = useCallback(() => {
    if (!messagesContainerRef.current) return;
    messagesContainerRef.current.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const result = await supportChatService.getAdminConversations({
        page: 1,
        pageSize: 20,
      });
      setConversations(result.items || []);
    } catch (error) {
      console.warn("[AdminSupportChatPage] Failed to load conversations:", error);
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const markConversationRead = useCallback(async (customerId: string) => {
    try {
      await supportChatHub.markConversationRead(customerId);
    } catch {
      await supportChatService.markAdminConversationRead(customerId);
    }
    setConversations((prev) =>
      prev.map((item) =>
        item.customerId === customerId ? { ...item, adminUnreadCount: 0 } : item
      )
    );
  }, []);

  const selectConversation = useCallback(
    async (customerId: string) => {
      if (activeConversationCustomerId && activeConversationCustomerId !== customerId) {
        await supportChatHub.leaveConversation(activeConversationCustomerId);
      }

      setActiveConversationCustomerId(customerId);
      setIsLoadingMessages(true);

      let loaded = false;
      try {
        const data: SupportConversationMessagesDto =
          await supportChatService.getAdminConversationMessages(customerId, {
            page: 1,
            pageSize: 50,
          });

        setActiveConversationMeta(
          data.conversation ||
            conversations.find((item) => item.customerId === customerId) ||
            null
        );
        setMessagesByCustomerId((prev) => ({
          ...prev,
          [customerId]: mergeUniqueMessages(prev[customerId] || [], data.messages || []),
        }));
        setConversations((prev) => {
          const existingIndex = prev.findIndex((item) => item.customerId === customerId);
          if (!data.conversation) return prev;
          if (existingIndex === -1) {
            return [data.conversation, ...prev];
          }
          const next = [...prev];
          next[existingIndex] = {
            ...next[existingIndex],
            ...data.conversation,
          };
          return next;
        });
        loaded = true;
      } catch (error) {
        console.warn(
          `[AdminSupportChatPage] Failed to load conversation ${customerId}:`,
          error
        );
      }

      if (loaded) {
        try {
          await supportChatHub.joinConversation(customerId);
          await markConversationRead(customerId);
        } catch (error) {
          console.warn(
            `[AdminSupportChatPage] Join/markRead failed for ${customerId}:`,
            error
          );
        }
      }
      setIsLoadingMessages(false);
    },
    [activeConversationCustomerId, conversations, markConversationRead]
  );

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, scrollToBottom]);

  useEffect(() => {
    if (!accessToken) return;
    let mounted = true;

    const onStatusChange = (status: ConnectionStatus) => {
      if (mounted) {
        setConnectionStatus(status);
      }
    };

    const onReceiveMessage = (message: SupportMessageDto) => {
      const customerId = message.isFromAdmin
        ? activeConversationCustomerId
        : message.senderId;
      if (!customerId) {
        return;
      }

      setMessagesByCustomerId((prev) => {
        const current = prev[customerId] || [];
        return {
          ...prev,
          [customerId]: mergeUniqueMessages(current, [message]),
        };
      });

      setConversations((prev) => {
        const index = prev.findIndex((item) => item.customerId === customerId);
        if (index === -1) return prev;

        const updated = [...prev];
        const current = updated[index];
        const unread =
          activeConversationCustomerId === customerId
            ? 0
            : (current.adminUnreadCount || 0) + (message.isFromAdmin ? 0 : 1);

        updated[index] = {
          ...current,
          adminUnreadCount: unread,
          lastMessageAt: message.createdAt,
          lastMessagePreview: message.content,
        };

        const [item] = updated.splice(index, 1);
        updated.unshift(item);
        return updated;
      });
    };

    const init = async () => {
      await loadConversations();
      await supportChatHub.connect(accessToken);
      supportChatHub.onStatusChange(onStatusChange);
      supportChatHub.onReceiveMessage(onReceiveMessage);
      setConnectionStatus(supportChatHub.getStatus());
    };

    init().catch((error) => {
      console.warn("[AdminSupportChatPage] Init failed:", error);
      setConnectionStatus("disconnected");
    });

    return () => {
      mounted = false;
      supportChatHub.offStatusChange(onStatusChange);
      supportChatHub.offReceiveMessage(onReceiveMessage);
      supportChatHub.disconnect().catch(() => undefined);
    };
  }, [accessToken, loadConversations]);

  const handleSend = async () => {
    const customerId = activeConversationCustomerId;
    const content = input.trim();
    if (!customerId || !content || isSending) return;
    setIsSending(true);

    try {
      await supportChatHub.sendMessage(customerId, content);
      setInput("");
    } catch {
      const response = await supportChatService.sendAdminMessage(customerId, content);
      setMessagesByCustomerId((prev) => ({
        ...prev,
        [customerId]: mergeUniqueMessages(prev[customerId] || [], [response]),
      }));
      setInput("");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] p-4 md:p-6">
      <div className="h-full rounded-2xl border bg-white grid grid-cols-1 md:grid-cols-[320px_1fr] overflow-hidden">
        <aside className="border-r bg-slate-50 flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-xl font-semibold">Chat hỗ trợ</h1>
          </div>

          <div className="overflow-y-auto flex-1">
            {isLoadingConversations ? (
              <p className="p-4 text-sm text-slate-500">Đang tải hội thoại...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">Chưa có cuộc hội thoại nào.</p>
            ) : (
              conversations.map((conversation) => {
                const isActive =
                  activeConversationCustomerId === conversation.customerId;
                return (
                  <button
                    key={conversation.customerId}
                    className={`w-full text-left p-4 border-b transition ${
                      isActive
                        ? "bg-emerald-100 border-l-4 border-l-emerald-500"
                        : "hover:bg-slate-100 border-l-4 border-l-transparent"
                    }`}
                    onClick={() => selectConversation(conversation.customerId)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium truncate">
                        {conversation.customerName || conversation.customerEmail || "Khách hàng"}
                      </p>
                      {conversation.adminUnreadCount > 0 && (
                        <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">
                          {conversation.adminUnreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 truncate mt-1">
                      {conversation.lastMessagePreview || "Chưa có tin nhắn"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatTime(conversation.lastMessageAt)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h2 className="font-semibold">
              {activeConversationMeta?.customerName ||
                activeConversationMeta?.customerEmail ||
                "Chọn một hội thoại để bắt đầu chat"}
            </h2>
          </div>

          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 bg-white space-y-4"
          >
            {!activeConversationCustomerId ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Chọn một cuộc hội thoại bên trái để bắt đầu chat
              </div>
            ) : isLoadingMessages ? (
              <p className="text-sm text-slate-500">Đang tải tin nhắn...</p>
            ) : activeMessages.length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có tin nhắn nào.</p>
            ) : (
              activeMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isFromAdmin ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                      message.isFromAdmin
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-900"
                    }`}
                  >
                    <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
                    <p className="mt-1 text-[11px] opacity-75">
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 border-t bg-slate-50">
            {connectionStatus === "reconnecting" && (
              <p className="mb-2 text-xs text-amber-600">
                Mất kết nối tạm thời, đang tự động kết nối lại...
              </p>
            )}
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập tin nhắn..."
                disabled={!activeConversationCustomerId || isSending}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={!activeConversationCustomerId || !input.trim() || isSending}
              >
                Gửi
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
