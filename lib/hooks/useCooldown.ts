"use client";

import { useCallback, useEffect, useState } from "react";

/** Số giây Retry-After từ lỗi 429 của API (nếu có). */
export function getRetryAfterSeconds(error: unknown): number | undefined {
  const e = error as { status?: number; retryAfterSeconds?: number } | null;
  if (e && e.status === 429) return e.retryAfterSeconds ?? 30;
  return undefined;
}

/**
 * Đếm ngược để tạm khóa nút gửi sau khi bị rate limit (HTTP 429, tôn trọng header Retry-After).
 * `start(error)` chỉ có tác dụng khi error là 429 và trả về true nếu đã bắt đầu đếm ngược.
 */
export function useCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const start = useCallback((error: unknown): boolean => {
    const seconds = getRetryAfterSeconds(error);
    if (!seconds) return false;
    setSecondsLeft(seconds);
    return true;
  }, []);

  return { secondsLeft, isCoolingDown: secondsLeft > 0, start };
}
