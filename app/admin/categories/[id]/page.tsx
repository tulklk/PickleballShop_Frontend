"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
import type { AdminCategoryChildRequest } from "@/lib/api/types";
import { DEBUG_API } from "@/lib/utils/debugApi";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Tên danh mục là bắt buộc"),
  description: z.string().trim().optional(),
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
  const [children, setChildren] = useState<AdminCategoryChildRequest[]>([]);

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
        description: category.description || "",
      });
      // Load children if they exist
      if (category.children && category.children.length > 0) {
        setChildren(
          category.children.map((child) => ({
            name: child.name || "",
            description: child.description || "",
          }))
        );
      } else {
        setChildren([]);
      }
    }
  }, [category, reset]);

  const handleChildNameChange = (index: number, value: string) => {
    setChildren((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: value };
      return next;
    });
  };

  const handleChildDescriptionChange = (index: number, value: string) => {
    setChildren((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], description: value };
      return next;
    });
  };

  const handleAddChildRow = () => {
    setChildren((prev) => [...prev, { name: "", description: "" }]);
  };

  const handleRemoveChildRow = (index: number) => {
    setChildren((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const trimmedName = data.name.trim();
      const trimmedDescription = data.description?.trim() || "";

      // Filter out empty children
      const childrenToUpdate = children
        .map((c) => ({
          name: c.name.trim(),
          description: c.description?.trim() || "",
        }))
        .filter((c) => c.name.length > 0);

      await updateCategory.mutateAsync({
        id: categoryId,
        data: {
          name: trimmedName,
          description: trimmedDescription,
          children: childrenToUpdate.length > 0 ? childrenToUpdate : null,
        },
      });
      toast.success("Đã cập nhật danh mục thành công");
      // Small delay to ensure cache is updated
      await new Promise((resolve) => setTimeout(resolve, 200));
      router.push("/admin/categories");
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Không thể lưu danh mục";
      toast.error(errorMessage);
      if (DEBUG_API) {
        console.error("Category save error:", error);
      }
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
          <CardTitle>Thông tin danh mục cha & danh mục con</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên danh mục cha</Label>
                <Input id="name" {...register("name")} placeholder="Ví dụ: Vợt Pickleball" />
                {errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Mô tả danh mục cha</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  rows={4}
                  placeholder="Mô tả về danh mục này..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Danh mục con (tuỳ chọn)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddChildRow}
                >
                  Thêm danh mục con
                </Button>
              </div>

              {children.map((child, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-gray-600">Tên danh mục con</Label>
                      <Input
                        value={child.name}
                        onChange={(e) => handleChildNameChange(index, e.target.value)}
                        placeholder={`Tên danh mục con ${index + 1}`}
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={children.length === 1}
                        onClick={() => handleRemoveChildRow(index)}
                      >
                        ✕
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600">Mô tả</Label>
                    <Textarea
                      value={child.description || ""}
                      onChange={(e) => handleChildDescriptionChange(index, e.target.value)}
                      placeholder="Mô tả danh mục con..."
                      rows={2}
                    />
                  </div>
                </div>
              ))}

              {children.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Chưa có danh mục con. Nhấn &quot;Thêm danh mục con&quot; để thêm.
                </p>
              )}
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

