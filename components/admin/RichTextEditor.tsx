"use client";

import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minLength?: number;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Nhập nội dung bài viết...",
  minLength = 100,
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  // Handle image upload to Cloudinary
  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "pickleball-shop/news");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Lỗi khi upload ảnh");
      }

      const data = await response.json();
      return data.url; // Cloudinary URL
    } catch (error: any) {
      toast.error(error.message || "Không thể upload ảnh");
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle paste event to upload images
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf("image") !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            const imageUrl = await handleImageUpload(file);
            insertImageAtCursor(imageUrl);
            toast.success("Đã chèn ảnh vào bài viết");
          } catch (error) {
            // Error already handled in handleImageUpload
          }
        }
        break;
      }
    }
  };

  // Handle file input for image upload
  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    try {
      const imageUrl = await handleImageUpload(file);
      insertImageAtCursor(imageUrl);
      toast.success("Đã chèn ảnh vào bài viết");
    } catch (error) {
      // Error already handled in handleImageUpload
    }

    // Reset input
    e.target.value = "";
  };

  // Insert image at cursor position
  const insertImageAtCursor = (imageUrl: string) => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

    if (range && selection) {
      // Insert image at cursor
      const img = document.createElement("img");
      img.src = imageUrl;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      img.style.margin = "1rem 0";
      img.alt = "News image";

      range.insertNode(img);
      range.setStartAfter(img);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Append to end if no selection
      const img = document.createElement("img");
      img.src = imageUrl;
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      img.style.margin = "1rem 0";
      img.alt = "News image";

      editorRef.current.appendChild(img);
    }

    // Update content
    updateContent();
  };

  // Update content when editor changes
  const updateContent = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle input events
  const handleInput = () => {
    updateContent();
  };

  // Format buttons
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContent();
  };

  return (
    <div className={`border rounded-lg ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 border-b bg-gray-50">
        <button
          type="button"
          onClick={() => execCommand("bold")}
          className="px-3 py-1 text-sm font-bold border rounded hover:bg-gray-200"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => execCommand("italic")}
          className="px-3 py-1 text-sm italic border rounded hover:bg-gray-200"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => execCommand("underline")}
          className="px-3 py-1 text-sm underline border rounded hover:bg-gray-200"
          title="Underline"
        >
          U
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "h2")}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "h3")}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          title="Heading 3"
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => execCommand("formatBlock", "p")}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          title="Paragraph"
        >
          P
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={() => execCommand("insertUnorderedList")}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          title="Bullet List"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => execCommand("insertOrderedList")}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          title="Numbered List"
        >
          1.
        </button>
        <div className="w-px h-6 bg-gray-300" />
        <label className="px-3 py-1 text-sm border rounded hover:bg-gray-200 cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={isUploading}
          />
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin inline" />
          ) : (
            "📷 Ảnh"
          )}
        </label>
        <div className="w-px h-6 bg-gray-300" />
        <button
          type="button"
          onClick={() => execCommand("removeFormat")}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
          title="Remove Format"
        >
          Clear
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className="min-h-[400px] p-4 focus:outline-none prose max-w-none"
        style={{
          whiteSpace: "pre-wrap",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* Character count */}
      <div className="px-4 py-2 border-t bg-gray-50 text-sm text-gray-500">
        {value.replace(/<[^>]*>/g, "").length} ký tự
        {minLength > 0 && (
          <span className={value.replace(/<[^>]*>/g, "").length < minLength ? "text-red-500" : "text-green-500"}>
            {" "}
            (Tối thiểu {minLength})
          </span>
        )}
      </div>

      <style jsx>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
