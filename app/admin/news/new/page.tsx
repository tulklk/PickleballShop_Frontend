"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminCreateNews, useNewsCategories } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Eye, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import type { CreateNewsRequest } from "@/lib/api/types";
import { uploadImage } from "@/lib/api/uploadImage";

export default function CreateNewsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "2";

  const { data: categories = [] } = useNewsCategories();
  const createNews = useAdminCreateNews();

  const [formData, setFormData] = useState<CreateNewsRequest>({
    title: "",
    content: "",
    summary: "",
    thumbnailUrl: "",
    category: "",
    tags: "",
    isPublished: false,
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Bạn cần quyền admin để truy cập trang này.</p>
      </div>
    );
  }

  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setThumbnailFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadThumbnail = async (): Promise<string> => {
    if (!thumbnailFile) {
      if (formData.thumbnailUrl) {
        return formData.thumbnailUrl; // Use existing URL
      }
      throw new Error("Vui lòng chọn ảnh đại diện");
    }

    setIsUploadingThumbnail(true);
    try {
      const data = await uploadImage(thumbnailFile, "pickleball-shop/news/thumbnails");
      return data.url;
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (publish: boolean) => {
    // Validation
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    if (!formData.content || formData.content.replace(/<[^>]*>/g, "").trim().length < 100) {
      toast.error("Nội dung phải có ít nhất 100 ký tự");
      return;
    }

    if (!formData.category) {
      toast.error("Vui lòng chọn danh mục");
      return;
    }

    try {
      // Upload thumbnail if needed
      let thumbnailUrl = formData.thumbnailUrl;
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail();
      }

      if (!thumbnailUrl) {
        toast.error("Vui lòng chọn ảnh đại diện");
        return;
      }

      // Create news
      const news = await createNews.mutateAsync({
        ...formData,
        thumbnailUrl,
        isPublished: publish,
      });

      toast.success(publish ? "Đã publish tin tức thành công!" : "Đã lưu bản nháp!");
      
      // Wait a bit for queries to refetch
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      router.push(`/admin/news/${news.id}`);
    } catch (error: any) {
      toast.error(error.message || "Không thể tạo tin tức");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-3xl font-bold">Tạo tin tức mới</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={createNews.isPending || isUploadingThumbnail}
          >
            <Save className="h-4 w-4 mr-2" />
            Lưu bản nháp
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={createNews.isPending || isUploadingThumbnail}
          >
            <Eye className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Title */}
        <Card>
          <CardHeader>
            <CardTitle>Tiêu đề</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Nhập tiêu đề bài viết..."
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-2">
              {formData.title.length} / 500 ký tự
            </p>
          </CardContent>
        </Card>

        {/* Category and Thumbnail */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Danh mục</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ảnh đại diện</CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="w-full mb-2"
              />
              {thumbnailPreview && (
                <img
                  src={thumbnailPreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded mt-2"
                />
              )}
              {formData.thumbnailUrl && !thumbnailPreview && (
                <img
                  src={formData.thumbnailUrl}
                  alt="Current thumbnail"
                  className="w-full h-48 object-cover rounded mt-2"
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Tóm tắt (Tùy chọn)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.summary || ""}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              placeholder="Nhập tóm tắt ngắn gọn..."
              rows={3}
              maxLength={1000}
            />
            <p className="text-sm text-gray-500 mt-2">
              {(formData.summary || "").length} / 1000 ký tự
            </p>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>Nội dung</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={formData.content}
              onChange={(content) =>
                setFormData({ ...formData, content })
              }
              minLength={100}
            />
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Tags (Tùy chọn)</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              value={formData.tags || ""}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              placeholder="Nhập tags, phân cách bằng dấu phẩy (ví dụ: vợt pickleball, gearbox, carbon)"
              maxLength={500}
            />
            <p className="text-sm text-gray-500 mt-2">
              {(formData.tags || "").length} / 500 ký tự
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
