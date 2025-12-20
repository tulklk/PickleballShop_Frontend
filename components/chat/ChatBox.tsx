"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import logo from "@/app/img/logopickleball.png";
import { cn } from "@/lib/utils";
import { useChatMessage } from "@/lib/api/hooks";
import type { ChatMessage as ChatMessageType, ChatMessageResponse } from "@/lib/api/types";

const SUGGESTED_QUESTIONS = [
  "Gợi ý giúp tôi các sản phẩm dành cho người mới đi",
  "Tôi nên chọn vợt nào cho người mới chơi?",
  "Có chương trình giảm giá nào không?",
];

interface SuggestedProduct {
  id: string;
  name: string;
  brand?: string;
  price?: number;
  originalPrice?: number | null;
  imageUrls?: string[] | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  suggestions?: SuggestedProduct[];
}

export function ChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Xin chào! Tôi là trợ lý AI của PickleBall Shop. Tôi có thể giúp bạn tìm hiểu về các sản phẩm pickleball, tư vấn chọn vợt, bóng, và các phụ kiện. Bạn cần hỗ trợ gì hôm nay?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const chatMutation = useChatMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Helper: format content from backend (support simple markdown **bold** and line breaks)
  const renderFormattedContent = (text: string) => {
    const paragraphs = text.split(/\n{2,}/);
    return paragraphs.map((para, idx) => {
      const html = para
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br/>");
      return (
        <p
          key={idx}
          className="mb-1 last:mb-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input when chat opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const handleSend = async (preset?: string) => {
    const content = (preset ?? input).trim();
    if (!content || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!preset) {
      setInput("");
    }
    // Hide suggestions after user interacts
    setShowSuggestions(false);

    try {
      // Build conversation history for context
      const conversationHistory: ChatMessageType[] = [
        ...messages.map((msg) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
        {
          role: "user",
          content,
        },
      ];

      const response: ChatMessageResponse = await chatMutation.mutateAsync({
        message: content,
        conversationHistory,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message || "Xin lỗi, tôi không thể trả lời câu hỏi này.",
        timestamp: new Date(),
        suggestions: response.suggestedProducts || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-20 md:bottom-24 right-3 md:right-6 z-50 h-12 w-12 md:h-14 md:w-14 rounded-full shadow-xl transition-transform duration-300 group flex items-center justify-center",
          isOpen
            ? "bg-red-500 hover:bg-red-600 hover:shadow-2xl hover:scale-105"
            : "bg-emerald-600 hover:bg-emerald-600 hover:shadow-2xl hover:scale-105"
        )}
        size="icon"
        aria-label={isOpen ? "Đóng chat" : "Mở chat"}
      >
        <div className="relative h-10 w-10">
          {/* Logo mặc định khi đóng, mờ dần khi hover */}
          <Image
            src={logo}
            alt="IKA Sport"
            fill
            className={cn(
              "object-contain transition-all duration-200",
              isOpen
                ? "opacity-0 scale-75"
                : "opacity-100 scale-100 group-hover:opacity-0 group-hover:scale-75"
            )}
          />
          {/* Icon tin nhắn khi hover (chỉ khi đang đóng) */}
          {!isOpen && (
            <MessageCircle
              className="absolute inset-0 m-auto h-7 w-7 text-white opacity-0 scale-75 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100"
            />
          )}
          {/* Icon X khi mở, có animation nhỏ */}
          {isOpen && (
            <X className="absolute inset-0 m-auto h-7 w-7 text-white transition-transform duration-200 rotate-0" />
          )}
        </div>
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-28 md:bottom-32 right-3 md:right-6 z-40 h-[550px] md:h-[520px] w-[calc(100vw-2rem)] md:w-[360px] max-w-[380px] max-h-[calc(100vh-6rem)] flex flex-col shadow-2xl border-2 border-green-200 rounded-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src={logo}
                  alt="IKA Sport"
                  width={24}
                  height={24}
                  className="rounded-full object-contain bg-white"
                />
                <CardTitle className="text-lg font-semibold">
                  Trợ lý AI PickleBall
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-2",
                    message.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="max-w-[80%] space-y-2">
                    <div
                      className={cn(
                        "rounded-lg px-4 py-2 shadow-sm",
                        message.role === "user"
                          ? "bg-green-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      )}
                    >
                      <div className="text-sm leading-relaxed space-y-1 break-words">
                        {renderFormattedContent(message.content)}
                      </div>
                      <p className="text-xs mt-2 opacity-70">
                        {message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Gợi ý sản phẩm từ backend */}
                    {message.role === "assistant" &&
                      message.suggestions &&
                      message.suggestions.length > 0 && (
                        <div className="grid grid-cols-1 gap-2">
                          {message.suggestions.map((prod) => {
                            const img =
                              prod.imageUrls && prod.imageUrls.length > 0
                                ? prod.imageUrls[0]!
                                : "/placeholder-product.jpg";
                            return (
                              <Link
                                key={prod.id}
                                href={`/products/${prod.id}`}
                                className="flex gap-3 rounded-md border border-gray-200 bg-white p-2 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer"
                                onClick={() => setIsOpen(false)}
                              >
                                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                                  {img === "/placeholder-product.jpg" ? (
                                    <div className="h-full w-full flex items-center justify-center text-[10px] text-gray-400">
                                      No img
                                    </div>
                                  ) : img.startsWith("http") ? (
                                    <Image
                                      src={img}
                                      alt={prod.name}
                                      fill
                                      className="object-cover"
                                      sizes="56px"
                                    />
                                  ) : (
                                    <img
                                      src={img}
                                      alt={prod.name}
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold line-clamp-2 text-gray-900">
                                    {prod.name}
                                  </p>
                                  {prod.brand && (
                                    <p className="text-xs text-gray-500">{prod.brand}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1 text-xs">
                                    {prod.price !== undefined && (
                                      <span className="font-semibold text-emerald-600">
                                        {new Intl.NumberFormat("vi-VN").format(prod.price)} đ
                                      </span>
                                    )}
                                    {prod.originalPrice &&
                                      prod.originalPrice > (prod.price || 0) && (
                                        <span className="text-gray-400 line-through">
                                          {new Intl.NumberFormat("vi-VN").format(
                                            prod.originalPrice
                                          )}{" "}
                                          đ
                                        </span>
                                      )}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-2 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-white text-gray-800 border border-gray-200 rounded-lg px-4 py-2 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200 p-4 bg-white">
              {/* Quick suggestions */}
              {showSuggestions && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      className="text-xs whitespace-nowrap"
                      onClick={() => {
                        setShowSuggestions(false);
                        handleSend(q);
                      }}
                      disabled={chatMutation.isPending}
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    if (e.target.value.trim().length > 0) {
                      setShowSuggestions(false);
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập câu hỏi của bạn..."
                  disabled={chatMutation.isPending}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || chatMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {/* Removed disclaimer text per request */}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

