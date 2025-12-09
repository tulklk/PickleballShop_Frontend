import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import {
  useProductCommentsBySlug,
  useAddProductCommentBySlug,
  useReplyProductCommentBySlug,
  useDeleteProductCommentBySlug,
} from "@/lib/api/hooks";
import type { ProductComment } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils/formatDate";
import Image from "next/image";

interface ProductCommentsProps {
  productSlug: string;
  productId?: string;
  isAdmin: boolean;
}

export function ProductComments({ productSlug, isAdmin }: ProductCommentsProps) {
  const { isAuthenticated } = useAuth();
  const { data: comments, isLoading } = useProductCommentsBySlug(productSlug);
  const addComment = useAddProductCommentBySlug(productSlug);
  const replyComment = useReplyProductCommentBySlug(productSlug);
  const deleteComment = useDeleteProductCommentBySlug(productSlug);
  const [content, setContent] = useState("");
  const [replyContent, setReplyContent] = useState<Record<string, string>>({});

  const draftKey = `comment-draft-${productSlug}`;

  // Restore draft after login
  useEffect(() => {
    if (isAuthenticated) {
      const draft = localStorage.getItem(draftKey);
      if (draft) setContent(draft);
    }
  }, [isAuthenticated, draftKey]);

  const handleAdd = async () => {
    if (!content.trim()) return;
    if (!isAuthenticated) {
      localStorage.setItem(draftKey, content.trim());
      const current = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
      return;
    }
    await addComment.mutateAsync(content.trim());
    setContent("");
    localStorage.removeItem(draftKey);
  };

  const handleReply = async (commentId: string) => {
    const text = replyContent[commentId];
    if (!text?.trim()) return;
    if (!isAuthenticated) {
      // store reply draft by comment
      localStorage.setItem(`${draftKey}-reply-${commentId}`, text.trim());
      const current = window.location.pathname;
      window.location.href = `/login?redirect=${encodeURIComponent(current)}`;
      return;
    }
    await replyComment.mutateAsync({ parentCommentId: commentId, content: text.trim() });
    setReplyContent((prev) => ({ ...prev, [commentId]: "" }));
    localStorage.removeItem(`${draftKey}-reply-${commentId}`);
  };

  const handleDelete = async (commentId: string) => {
    if (!isAuthenticated || !isAdmin) return;
    await deleteComment.mutateAsync(commentId);
  };

  const renderComment = (comment: ProductComment, depth = 0) => {
    const displayName = comment.userFullName || comment.userName || "Người dùng";
    const avatar = comment.userAvatar;
    const isAdminComment = !!comment.isAdmin;

    return (
      <div key={comment.id} className={`border rounded-lg p-3 mb-3 ${depth > 0 ? "ml-4" : ""}`}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center overflow-hidden shrink-0">
            {avatar ? (
              <Image
                src={avatar}
                alt={displayName}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-emerald-700 font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-emerald-900">{displayName}</span>
                {isAdminComment && (
                  <span className="inline-flex items-center justify-center h-5 w-5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                    >
                      <path
                        fill="#0EA15F"
                        d="M10.9 2.2c.5-.3 1.2-.3 1.7 0l1.7 1c.2.1.4.1.6 0l1.8-1c.5-.3 1.2-.3 1.7 0l1.6 1c.5.3.8.9.7 1.5l-.4 1.9c0 .2 0 .4.2.6l1.4 1.5c.4.4.5 1.1.3 1.6l-.7 1.8c-.1.2-.1.4 0 .6l.7 1.8c.2.6.1 1.2-.3 1.7l-1.4 1.5c-.1.2-.2.4-.2.6l.4 1.9c.1.6-.2 1.2-.7 1.5l-1.6 1c-.5.3-1.2.3-1.7 0l-1.8-1c-.2-.1-.4-.1-.6 0l-1.7 1c-.5.3-1.2.3-1.7 0l-1.7-1c-.2-.1-.4-.1-.6 0l-1.7 1c-.5.3-1.2.3-1.7 0l-1.6-1c-.5-.3-.8-.9-.7-1.5l.4-1.9c0-.2 0-.4-.2-.6l-1.4-1.5c-.4-.4-.5-1.1-.3-1.6l.7-1.8c.1-.2.1-.4 0-.6l-.7-1.8c-.2-.6-.1-1.2.3-1.7l1.4-1.5c.1-.2.2-.4.2-.6l-.4-1.9c-.1-.6.2-1.2.7-1.5l1.6-1c.5-.3 1.2-.3 1.7 0l1.7 1c.2.1.4.1.6 0l1.7-1Zm-2 12.8 5.9-5.9-1.4-1.4-4.5 4.5-1.8-1.8-1.4 1.4 3.2 3.2Z"
                      />
                    </svg>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                {comment.createdAt ? formatDateTime(comment.createdAt) : ""}
                {isAdmin && (
                  <button
                    className="text-red-500 hover:underline"
                    disabled={deleteComment.isPending}
                    onClick={() => handleDelete(comment.id)}
                  >
                    Xóa
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-800 mt-2 whitespace-pre-line">{comment.content}</p>

            {isAdmin && (
              <div className="mt-2">
                <Textarea
                  placeholder="Trả lời với tư cách Admin..."
                  value={replyContent[comment.id] || ""}
                  onChange={(e) => setReplyContent((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                  className="mb-2"
                  rows={2}
                />
                <Button
                  size="sm"
                  disabled={replyComment.isPending}
                  onClick={() => handleReply(comment.id)}
                >
                  Trả lời
                </Button>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 space-y-2">
                {comment.replies.map((child) => renderComment(child, depth + 1))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mt-8">
      <h3 className="text-lg font-bold text-emerald-900 mb-4">Bình luận</h3>

      {/* Add comment */}
      <div className="mb-4">
        <Textarea
          placeholder={
            isAuthenticated
              ? "Viết bình luận..."
              : "Đăng nhập để bình luận"
          }
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          disabled={!isAuthenticated || addComment.isPending}
        />
        <Button
          className="mt-2"
          onClick={handleAdd}
          disabled={!isAuthenticated || addComment.isPending || !content.trim()}
        >
          Gửi bình luận
        </Button>
      </div>

      {/* Comments list */}
      {isLoading ? (
        <p className="text-sm text-gray-500">Đang tải bình luận...</p>
      ) : (comments?.length || 0) === 0 ? (
        <p className="text-sm text-gray-500">Chưa có bình luận nào.</p>
      ) : (
        <div className="space-y-2">
          {comments!.map((comment) => renderComment(comment))}
        </div>
      )}
    </section>
  );
}

