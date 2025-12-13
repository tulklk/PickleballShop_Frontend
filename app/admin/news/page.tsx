"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAllNews, useAdminDeleteNews } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { formatDate } from "@/lib/utils/formatDate";
import Image from "next/image";

export default function AdminNewsPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "Admin" || user?.role === "2";

  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 20,
    category: "",
    searchTerm: "",
    isPublished: null as boolean | null,
  });

  const { data: newsData, isLoading } = useAdminAllNews(filters);
  const deleteNews = useAdminDeleteNews();

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Bạn cần quyền admin để truy cập trang này.</p>
      </div>
    );
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tin tức "${title}"?`)) return;

    try {
      await deleteNews.mutateAsync(id);
      toast.success("Đã xóa tin tức thành công");
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa tin tức");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản lý tin tức</h1>
        <Button onClick={() => router.push("/admin/news/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo tin tức mới
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Tìm kiếm..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value, page: 1 })
              }
              className="md:col-span-2"
            />
            <select
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value, page: 1 })
              }
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Tất cả danh mục</option>
              <option value="Tin tức">Tin tức</option>
              <option value="Kiến thức">Kiến thức</option>
              <option value="Đánh giá sản phẩm">Đánh giá sản phẩm</option>
              <option value="Kỹ thuật Pickleball">Kỹ thuật Pickleball</option>
              <option value="Mẹo TIPS Pickleball">Mẹo TIPS Pickleball</option>
              <option value="Luật chơi Pickleball">Luật chơi Pickleball</option>
              <option value="Khuyến mãi">Khuyến mãi</option>
            </select>
            <select
              value={
                filters.isPublished === null
                  ? "all"
                  : filters.isPublished
                  ? "published"
                  : "draft"
              }
              onChange={(e) =>
                setFilters({
                  ...filters,
                  isPublished:
                    e.target.value === "all"
                      ? null
                      : e.target.value === "published",
                  page: 1,
                })
              }
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Tất cả</option>
              <option value="published">Đã publish</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* News Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {newsData?.items.map((item) => (
              <Card key={item.id} className="h-full flex flex-col hover:shadow-lg transition-shadow">
                <div className="relative h-48 w-full">
                  {item.thumbnailUrl.includes("cloudinary.com") ||
                  item.thumbnailUrl.startsWith("http") ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      className="object-cover rounded-t-lg"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    {item.isPublished ? (
                      <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-semibold flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Đã publish
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-500 text-white rounded text-xs font-semibold flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Draft
                      </span>
                    )}
                  </div>
                </div>
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                        {item.category}
                      </span>
                      <span>•</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>
                    <h3 className="font-semibold text-base mb-2 line-clamp-2 min-h-[3rem]">
                      {item.title}
                    </h3>
                    {item.summary && (
                      <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                        {item.summary}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{item.authorName}</span>
                      <span>{item.viewCount} lượt xem</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-auto pt-3 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/admin/news/${item.id}`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Sửa
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDelete(item.id, item.title)}
                      disabled={deleteNews.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {newsData && newsData.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ ...filters, page: filters.page - 1 })
                }
                disabled={!newsData.hasPreviousPage}
              >
                Trước
              </Button>
              <span className="px-4">
                Trang {newsData.page} / {newsData.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ ...filters, page: filters.page + 1 })
                }
                disabled={!newsData.hasNextPage}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
