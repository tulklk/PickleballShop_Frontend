"use client";

import dynamic from "next/dynamic";

const ChatBox = dynamic(
  () => import("@/components/chat/ChatBox").then((m) => m.ChatBox),
  { ssr: false, loading: () => null }
);
const SupportChatBox = dynamic(
  () => import("@/components/chat/SupportChatBox").then((m) => m.SupportChatBox),
  { ssr: false, loading: () => null }
);
const ZaloButton = dynamic(
  () => import("@/components/chat/ZaloButton").then((m) => m.ZaloButton),
  { ssr: false, loading: () => null }
);
const ScrollToTop = dynamic(
  () => import("@/components/layout/ScrollToTop").then((m) => m.ScrollToTop),
  { ssr: false, loading: () => null }
);

/**
 * Chat / Zalo / scroll: không cần cho LCP — tải sau khi bundle chính, giảm JS trên critical path.
 */
export function DeferredClientWidgets() {
  return (
    <>
      <ChatBox />
      <SupportChatBox />
      <ZaloButton />
      <ScrollToTop />
    </>
  );
}
