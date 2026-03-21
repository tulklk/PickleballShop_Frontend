"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, User, X } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import Link from "next/link";
import Image from "next/image";
import type {
  SupportConversationDto,
  SupportMessageDto,
} from "@/lib/api/types";
import { supportChatService } from "@/src/services/supportChatService";
import {
  supportChatHub,
  type ConnectionStatus,
} from "@/src/services/supportChatHub";
import { cn } from "@/lib/utils";

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
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
};

export function SupportChatBox() {
  const { user, isAuthenticated, isAdmin, accessToken } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<SupportMessageDto[]>([]);
  const [conversation, setConversation] = useState<SupportConversationDto | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = user?.id ?? "";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const loadConversation = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await supportChatService.getMyConversation({
        page: 1,
        pageSize: 50,
      });
      setConversation(data.conversation);
      setMessages(data.messages || []);
    } catch (error) {
      console.warn("[SupportChatBox] Failed to load conversation:", error);
      setConversation(null);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markRead = useCallback(async () => {
    try {
      await supportChatHub.markConversationRead();
    } catch {
      await supportChatService.markMyConversationRead();
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!isOpen || !accessToken || !isAuthenticated) return;

    let mounted = true;

    const onStatusChange = (status: ConnectionStatus) => {
      if (mounted) {
        setConnectionStatus(status);
      }
    };

    const onReceiveMessage = (incoming: SupportMessageDto) => {
      if (!incoming.conversationId) {
        return;
      }
      setMessages((prev) => mergeUniqueMessages(prev, [incoming]));
    };

    const init = async () => {
      await loadConversation();
      const connected = await supportChatHub.connect(accessToken);
      supportChatHub.onStatusChange(onStatusChange);
      supportChatHub.onReceiveMessage(onReceiveMessage);
      if (connected) {
        await supportChatHub.joinConversation();
        await markRead();
      }
      setConnectionStatus(supportChatHub.getStatus());
    };

    init().catch((error) => {
      console.warn("[SupportChatBox] Init failed:", error);
      setConnectionStatus("disconnected");
    });

    return () => {
      mounted = false;
      supportChatHub.offStatusChange(onStatusChange);
      supportChatHub.offReceiveMessage(onReceiveMessage);
      supportChatHub.leaveConversation().catch(() => undefined);
      supportChatHub.disconnect().catch(() => undefined);
    };
  }, [accessToken, isOpen, isAuthenticated, loadConversation, markRead]);

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    markRead().catch((error) => {
      console.warn("[SupportChatBox] markRead failed:", error);
    });
  }, [isOpen, isAuthenticated, messages.length, markRead]);

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !currentUserId || isSending) return;

    setIsSending(true);
    try {
      await supportChatHub.sendMessage(currentUserId, content);
      setInput("");
    } catch {
      const response = await supportChatService.sendMyMessage(content);
      setMessages((prev) => mergeUniqueMessages(prev, [response]));
      setInput("");
    } finally {
      setIsSending(false);
    }
  };

  const statusLabel = useMemo(() => {
    if (connectionStatus === "reconnecting") return "Đang kết nối lại...";
    if (connectionStatus === "connected") return "Đang trực tuyến";
    return "Mất kết nối";
  }, [connectionStatus]);

  return (
    <>
      <Button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "fixed bottom-36 md:bottom-40 right-3 md:right-6 z-50 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-xl border border-white/30 transition-transform duration-300",
          isOpen
            ? "bg-red-500 hover:bg-red-600"
            : "bg-emerald-600 hover:bg-emerald-700 hover:scale-105 animate-pulse"
        )}
        size="icon"
        aria-label={isOpen ? "Đóng chat hỗ trợ" : "Mở chat hỗ trợ"}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Image
            src="/img/supportmessage.png"
            alt="Support chat"
            width={36}
            height={36}
            className="h-8 w-8 md:h-9 md:w-9 object-contain"
          />
        )}
      </Button>

      {isOpen && (
        <Card className="fixed bottom-28 md:bottom-32 right-3 md:right-6 z-40 h-[520px] w-[calc(100vw-2rem)] md:w-[360px] max-w-[380px] flex flex-col shadow-2xl border-2 border-emerald-200 rounded-lg overflow-hidden chat-panel-enter">
          <CardHeader className="bg-linear-to-r from-emerald-600 to-emerald-500 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Chat hỗ trợ khách hàng
              </CardTitle>
              <span className="text-xs opacity-90">{statusLabel}</span>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
              {!isAuthenticated ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3">
                  <p className="text-sm text-slate-600">
                    Vui lòng đăng nhập để sử dụng chat hỗ trợ.
                  </p>
                  <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                    <Link
                      href="/login"
                      onClick={() => {
                        setIsOpen(false);
                      }}
                    >
                      Đăng nhập
                    </Link>
                  </Button>
                </div>
              ) : isLoading ? (
                <p className="text-sm text-slate-500">Đang tải hội thoại...</p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Chưa có hội thoại nào. Hãy gửi tin nhắn đầu tiên để bắt đầu.
                </p>
              ) : (
                messages.map((message, index) => {
                  const isMine = !message.isFromAdmin;
                  const senderLabel = message.isFromAdmin
                    ? "Admin"
                    : user?.fullName || message.senderName || "Bạn";
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2 chat-bubble-in",
                        isMine ? "justify-end" : "justify-start"
                      )}
                      style={{ animationDelay: `${Math.min(index, 8) * 24}ms` }}
                    >
                      {!isMine && (
                        <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] rounded-lg px-4 py-2 shadow-sm text-sm",
                          isMine
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-800 border border-slate-200"
                        )}
                      >
                        <p className="text-[11px] font-semibold opacity-90 mb-1">
                          {senderLabel}
                        </p>
                        <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
                        <p className="text-[11px] mt-2 opacity-75">
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200 p-4 bg-white">
              {connectionStatus === "reconnecting" && (
                <p className="mb-2 text-xs text-amber-600">
                  Kết nối đang gián đoạn, hệ thống đang thử kết nối lại...
                </p>
              )}
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Nhập tin nhắn hỗ trợ..."
                  disabled={!isAuthenticated || isSending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!isAuthenticated || !input.trim() || isSending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
