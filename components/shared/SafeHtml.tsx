"use client";

import { useEffect, useState, type ElementType } from "react";
import { sanitizeHtml } from "@/lib/security/sanitizeHtml";

interface SafeHtmlProps {
  html: string | null | undefined;
  className?: string;
  as?: ElementType;
}

/**
 * Render HTML đã được sanitize (allowlist). Việc sanitize chạy ở client sau khi mount
 * (cần DOM); trước đó nội dung rỗng nên không có HTML chưa lọc nào được render.
 */
export function SafeHtml({ html, className, as: Tag = "div" }: SafeHtmlProps) {
  const [clean, setClean] = useState("");

  useEffect(() => {
    setClean(sanitizeHtml(html));
  }, [html]);

  return <Tag className={className} dangerouslySetInnerHTML={{ __html: clean }} />;
}
