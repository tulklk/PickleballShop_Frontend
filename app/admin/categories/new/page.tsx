"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAdminCreateCategory } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { DEBUG_API } from "@/lib/utils/debugApi";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Tên danh mục là bắt buộc"),
  description: z.string().trim().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface ChildInput {
  name: string;
  description: string;
}

export default function CreateCategoryPage() {
  const router = useRouter();
  const createCategory = useAdminCreateCategory();
  const [children, setChildren] = useState<ChildInput[]>([
    { name: "", description: "" },
  ]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const handleChildChange = (
    index: number,
    field: keyof ChildInput,
    value: string
  ) => {
    setChildren((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
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

      // Chuẩn bị children giống schema BE
      const childrenPayload = children
        .map((c) => ({
          name: c.name.trim(),
          description: c.description.trim(),
        }))
        .filter((c) => c.name.length > 0);

      await createCategory.mutateAsync({
        name: trimmedName,
        description: trimmedDescription,
        children: childrenPayload.length > 0 ? childrenPayload : undefined,
      });

      toast.success("Đã tạo danh mục thành công");
      // Small delay to ensure cache is updated
      await new Promise((resolve) => setTimeout(resolve, 200));
      router.push("/admin/categories");
    } catch (error: any) {
      const errorMessage =
        error?.data?.message || error?.message || "Không thể lưu danh mục";
      toast.error(errorMessage);
      if (DEBUG_API) {
        console.error("Category save error:", error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tạo danh mục mới</h1>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin danh mục cha & danh mục con</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Tên danh mục cha</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="Ví dụ: Vợt Pickleball"
                />
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
                <div key={index} className="space-y-2 border rounded-md p-3">
                  <div className="flex gap-2">
                    <Input
                      value={child.name}
                      onChange={(e) =>
                        handleChildChange(index, "name", e.target.value)
                      }
                      placeholder={`Tên danh mục con ${index + 1}`}
                    />
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
                  <Textarea
                    value={child.description}
                    onChange={(e) =>
                      handleChildChange(index, "description", e.target.value)
                    }
                    rows={2}
                    placeholder="Mô tả danh mục con (tuỳ chọn)"
                  />
                </div>
              ))}

              <p className="text-xs text-muted-foreground">
                Ví dụ: danh mục cha &quot;Vợt Pickleball&quot; có các danh mục
                con như &quot;Vợt Pickleball Joola&quot;, &quot;Vợt Pickleball
                Franklin&quot;...
              </p>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createCategory.isPending}>
                {createCategory.isPending ? "Đang lưu..." : "Tạo danh mục"}
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
