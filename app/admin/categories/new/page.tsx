"use client";

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

const categorySchema = z.object({
  name: z.string().trim().min(1, "Tên danh mục là bắt buộc"),
  description: z.string().trim().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CreateCategoryPage() {
  const router = useRouter();
  const createCategory = useAdminCreateCategory();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  });

  const onSubmit = async (data: CategoryFormData) => {
    try {
      const trimmedName = data.name.trim();
      const trimmedDescription = data.description?.trim() || "";

      await createCategory.mutateAsync({
        id: "",
        name: trimmedName,
        slug: null,
        description: trimmedDescription,
        parentCategoryId: null,
      });
      toast.success("Đã tạo danh mục thành công");
      router.push("/admin/categories");
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Không thể lưu danh mục";
      toast.error(errorMessage);
      console.error("Category save error:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Tạo danh mục mới</h1>

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
              <Label htmlFor="description">Mô tả</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={4}
                placeholder="Mô tả về danh mục này..."
              />
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
