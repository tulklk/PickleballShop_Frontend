"use client";

import { useEffect, useState } from "react";
import { List, ChevronUp, ChevronDown } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
}

export function TableOfContents({ content, className = "" }: TableOfContentsProps) {
  const [tocItems, setTocItems] = useState<TocItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (!content) return;

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;

    // Find all headings (h1, h2, h3)
    const headings = tempDiv.querySelectorAll("h1, h2, h3");
    const items: TocItem[] = [];

    headings.forEach((heading, index) => {
      const text = heading.textContent || "";
      if (!text.trim()) return;
      
      const level = parseInt(heading.tagName.charAt(1));
      const id = `heading-${index}-${text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;

      items.push({
        id,
        text: text.trim(),
        level,
      });
    });

    setTocItems(items);
  }, [content]);

  const scrollToHeading = (id: string) => {
    // Wait a bit for content to render
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 100; // Offset for sticky header
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  if (tocItems.length === 0) return null;

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 mb-6 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <List className="h-5 w-5" />
          Mục lục
        </h3>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors"
          aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {isExpanded && (
        <ol className="space-y-2 list-decimal list-inside">
          {tocItems.map((item, index) => (
            <li
              key={item.id}
              className={`cursor-pointer hover:text-brand-green-500 transition-colors text-sm ${
                item.level === 1
                  ? "font-semibold"
                  : item.level === 2
                  ? "ml-4 font-medium"
                  : "ml-8"
              }`}
              onClick={() => scrollToHeading(item.id)}
            >
              <span>{item.text}</span>
            </li>
          ))}
        </ol>
      )}

    </div>
  );
}
