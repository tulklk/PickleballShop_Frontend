"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface NewsCommentsProps {
  newsId: string;
  slug: string;
}

export function NewsComments({ newsId, slug }: NewsCommentsProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error("Vui lòng nhập tên của bạn");
      return;
    }

    if (!formData.phone.trim()) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }

    if (!formData.content.trim()) {
      toast.error("Vui lòng nhập nội dung bình luận");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Implement API call to create comment
      // For now, just show success message
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Bình luận của bạn đã được gửi thành công!");
      setFormData({
        name: "",
        email: "",
        phone: "",
        content: "",
      });
    } catch (error) {
      toast.error("Có lỗi xảy ra khi gửi bình luận. Vui lòng thử lại.");
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">
        Bình luận ({0} bình luận)
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Textarea
            placeholder="Xin mời nhập ý kiến của bạn tại đây"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            className="min-h-[120px] resize-none"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tên của bạn <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nhập tên của bạn"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Nhập email của bạn"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Nhập số điện thoại"
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-green-500 hover:bg-brand-green-600 text-white px-8"
          >
            {isSubmitting ? "Đang gửi..." : "GỬI BÌNH LUẬN"}
          </Button>
        </div>
      </form>

      {/* Comments List - TODO: Implement when API is ready */}
      <div className="mt-8 space-y-4">
        {/* Comment items will be displayed here */}
      </div>
    </div>
  );
}
