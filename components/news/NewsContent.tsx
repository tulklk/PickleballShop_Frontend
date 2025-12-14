"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

interface NewsContentProps {
  content: string; // HTML content with Cloudinary image URLs
  className?: string;
}

export function NewsContent({ content, className = "" }: NewsContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && content) {
      // Set HTML content
      contentRef.current.innerHTML = content;

      // Add IDs to headings for table of contents
      const headings = contentRef.current.querySelectorAll("h1, h2, h3");
      headings.forEach((heading, index) => {
        const text = heading.textContent || "";
        const id = `heading-${index}-${text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`;
        heading.id = id;
      });

      // Process all images in the content to use Next.js Image component
      const images = contentRef.current.querySelectorAll("img");
      images.forEach((img) => {
        const src = img.getAttribute("src");
        if (src) {
          // Check if it's a Cloudinary URL
          if (src.includes("cloudinary.com") || src.startsWith("http")) {
            // Keep the image but ensure it's responsive
            img.style.maxWidth = "100%";
            img.style.height = "auto";
            img.style.display = "block";
            img.style.margin = "1rem 0";
            
            // Add loading="lazy" for performance
            img.setAttribute("loading", "lazy");
            
            // Add error handler
            img.onerror = () => {
              img.style.display = "none";
            };
          }
        }
      });
    }
  }, [content]);

  return (
    <div
      ref={contentRef}
      className={`prose prose-lg max-w-none ${className}`}
      style={{
        // Ensure images are responsive
        wordBreak: "break-word",
      }}
    />
  );
}
