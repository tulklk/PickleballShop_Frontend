"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAdminCategory,
  useAdminUpdateCategory,
} from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục là bắt buộc"),
  slug: z.string().min(1, "Slug là bắt buộc"),
  description: z.string().optional(),
  parentCategoryId: z.string().uuid().optional().nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoryFormPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  
  // This page is only for editing, not creating
  // Creating is handled by /admin/categories/new/page.tsx
  const { data: category, isLoading, isError } = useAdminCategory(categoryId);
  const updateCategory = useAdminUpdateCategory();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  // Load existing category data
  useEffect(() => {
    if (category) {
      reset({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        parentCategoryId: category.parentCategoryId || null,
      });
    }
  }, [category, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      await updateCategory.mutateAsync({
        id: categoryId,
        data: {
          id: categoryId,
          name: data.name,
          slug: data.slug,
          description: data.description ?? null,
          parentCategoryId: data.parentCategoryId ?? null,
        },
      });
      toast.success("Đã cập nhật danh mục thành công");
      router.push("/admin/categories");
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Không thể lưu danh mục";
      toast.error(errorMessage);
      console.error("Category save error:", error);
    }
  };

  // Show loading state when editing
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Đang tải danh mục...</div>
      </div>
    );
  }

  // Show error state when editing and error occurred
  if (isError || !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-2">Không tìm thấy danh mục</p>
            <Button variant="outline" onClick={() => router.push("/admin/categories")}>
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Chỉnh sửa danh mục</h1>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin danh mục</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Tên danh mục</Label>
              <Input id="name" {...register("name")} placeholder="Ví dụ: Vợt Pickleball" />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">Slug (đường dẫn)</Label>
              <Input id="slug" {...register("slug")} placeholder="Ví dụ: vot-pickleball" />
              {errors.slug && (
                <p className="text-sm text-destructive mt-1">
                  {errors.slug.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Slug sẽ được dùng trong URL, nên viết thường và dùng dấu gạch ngang
              </p>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={4}
                placeholder="Mô tả về danh mục này..."
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={updateCategory.isPending}>
                {updateCategory.isPending ? "Đang lưu..." : "Cập nhật danh mục"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/categories")}
              >
                Hủy
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

