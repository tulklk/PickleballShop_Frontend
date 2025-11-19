"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useAdminCategory,
  useAdminUpdateCategory,
  useAdminCreateCategory,
} from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  parentCategoryId: z.string().uuid().optional().nullable(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoryFormPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  const isNew = categoryId === "new";

  const { data: category } = useAdminCategory(categoryId, {
    enabled: !isNew,
  });
  const updateCategory = useAdminUpdateCategory();
  const createCategory = useAdminCreateCategory();

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
    if (category && !isNew) {
      reset({
        name: category.name || "",
        slug: category.slug || "",
        description: category.description || "",
        parentCategoryId: category.parentCategoryId || null,
      });
    }
  }, [category, isNew, reset]);

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isNew) {
        await createCategory.mutateAsync({
          id: "",
          ...data,
        });
        toast.success("Category created successfully");
      } else {
        await updateCategory.mutateAsync({
          id: categoryId,
          data: {
            id: categoryId,
            ...data,
          },
        });
        toast.success("Category updated successfully");
      }
      router.push("/admin/categories");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to save category");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {isNew ? "Create Category" : "Edit Category"}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Category Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...register("slug")} />
              {errors.slug && (
                <p className="text-sm text-destructive mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                rows={4}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit">
                {isNew ? "Create" : "Update"} Category
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

