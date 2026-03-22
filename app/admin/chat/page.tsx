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
  const activeConversationCustomerIdRef = useRef<string | null>(null);
  const conversationsRef = useRef<SupportConversationDto[]>([]);

  useEffect(() => {
    activeConversationCustomerIdRef.current = activeConversationCustomerId;
  }, [activeConversationCustomerId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

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
      const conv = conversationsRef.current.find((c) => c.id === message.conversationId);
      let targetCustomerId: string | null = null;

      if (conv?.customerId) {
        targetCustomerId = String(conv.customerId);
      } else if (!message.isFromAdmin) {
        targetCustomerId = message.senderId ? String(message.senderId) : null;
      } else {
        const activeId = activeConversationCustomerIdRef.current;
        targetCustomerId = activeId ? String(activeId) : null;
      }

      if (!targetCustomerId) {
        return;
      }

      setMessagesByCustomerId((prev) => {
        const current = prev[targetCustomerId] || [];
        return {
          ...prev,
          [targetCustomerId]: mergeUniqueMessages(current, [message]),
        };
      });

      setConversations((prev) => {
        const index = prev.findIndex((item) => item.customerId === targetCustomerId);
        if (index === -1) return prev;

        const updated = [...prev];
        const current = updated[index];
        const viewing =
          activeConversationCustomerIdRef.current === targetCustomerId;
        const unread = viewing
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

  /** Khi khách gửi qua REST (SignalR lỗi), server có thể không broadcast — đồng bộ định kỳ. */
  useEffect(() => {
    if (!accessToken || !activeConversationCustomerId) return;

    const sync = async () => {
      const customerId = activeConversationCustomerId;
      try {
        const data = await supportChatService.getAdminConversationMessages(customerId, {
          page: 1,
          pageSize: 50,
        });
        setMessagesByCustomerId((prev) => ({
          ...prev,
          [customerId]: mergeUniqueMessages(prev[customerId] || [], data.messages || []),
        }));
        if (data.conversation) {
          setActiveConversationMeta(data.conversation);
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c.customerId === customerId);
            if (idx === -1) return [data.conversation!, ...prev];
            const next = [...prev];
            next[idx] = { ...next[idx], ...data.conversation! };
            return next;
          });
        }
      } catch {
        /* ignore */
      }
    };

    const interval = setInterval(sync, 4000);
    void sync();
    return () => clearInterval(interval);
  }, [accessToken, activeConversationCustomerId]);

  const handleSend = async () => {
    const customerId = activeConversationCustomerId;
    const content = input.trim();
    if (!customerId || !content || isSending) return;
    setIsSending(true);

    try {
      if (supportChatHub.getStatus() === "connected") {
        try {
          await supportChatHub.sendMessage(customerId, content);
          setInput("");
          return;
        } catch (hubErr) {
          console.warn("[AdminSupportChatPage] Hub send failed, using REST:", hubErr);
        }
      }

      const response = await supportChatService.sendAdminMessage(customerId, content);
      setMessagesByCustomerId((prev) => ({
        ...prev,
        [customerId]: mergeUniqueMessages(prev[customerId] || [], [response]),
      }));
      setInput("");
    } catch (error) {
      console.warn("[AdminSupportChatPage] Send failed:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-1rem)] min-h-0 flex-col p-4 md:h-[calc(100vh-2rem)] md:p-6">
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden rounded-2xl border bg-white md:grid-cols-[320px_1fr] md:grid-rows-[minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r bg-slate-50 md:h-full md:max-h-full">
          <div className="shrink-0 border-b p-4">
            <h1 className="text-xl font-semibold">Chat hỗ trợ</h1>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
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

        <section className="flex min-h-0 min-w-0 flex-1 flex-col md:h-full">
          <div className="shrink-0 border-b p-4">
            <h2 className="font-semibold">
              {activeConversationMeta?.customerName ||
                activeConversationMeta?.customerEmail ||
                "Chọn một hội thoại để bắt đầu chat"}
            </h2>
          </div>

          <div
            ref={messagesContainerRef}
            className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain bg-white p-4 [scrollbar-gutter:stable]"
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

          <div className="shrink-0 border-t bg-slate-50 p-4">
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
