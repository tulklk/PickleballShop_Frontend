"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem } from "@/components/ui/select";
import type { Product, ProductCategory } from "@/lib/api/types";

const productSchema = z.object({
  name: z.string().min(2, "Required"),
  slug: z.string().min(2, "Required"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Required"),
  price: z.number().min(0),
  originalPrice: z.number().nullable().optional(),
  stockQuantity: z.number().int().min(0),
  sku: z.string().optional(),
  brand: z.string().optional(),
  isActive: z.boolean(),
  productType: z.number().int().min(1),
  skillLevel: z.number().int().min(1),
  weightRange: z.number().int().min(1),
  surfaceType: z.number().int().min(1),
  material: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

const productTypeOptions = [
  { value: 1, label: "Performance Paddle" },
  { value: 2, label: "Ball" },
  { value: 3, label: "Shoes" },
  { value: 4, label: "Net" },
  { value: 5, label: "Bag" },
  { value: 6, label: "Accessory" },
  { value: 7, label: "Other" },
];

const skillLevelOptions = [
  { value: 1, label: "Beginner" },
  { value: 2, label: "Intermediate" },
  { value: 3, label: "Advanced" },
];

const weightOptions = [
  { value: 1, label: "Light" },
  { value: 2, label: "Balanced" },
  { value: 3, label: "Heavy" },
];

const surfaceOptions = [
  { value: 1, label: "Carbon" },
  { value: 2, label: "Composite" },
  { value: 3, label: "Graphite" },
];

interface ProductFormProps {
  categories: ProductCategory[] | undefined;
  initialData?: Product | null;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  loading?: boolean;
}

export function ProductForm({
  categories,
  initialData,
  onSubmit,
  loading,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: undefined,
      categoryId: "",
      price: 0,
      originalPrice: undefined,
      stockQuantity: 0,
      sku: undefined,
      brand: undefined,
      isActive: true,
      productType: 1,
      skillLevel: 1,
      weightRange: 2,
      surfaceType: 1,
      material: undefined,
    },
  });

  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name || "");
      setValue("slug", initialData.slug || "");
      setValue("description", initialData.description || "");
      setValue("categoryId", initialData.categoryId);
      setValue("price", initialData.price);
      setValue("originalPrice", initialData.originalPrice ?? undefined);
      setValue("stockQuantity", initialData.stockQuantity);
      setValue("sku", initialData.sku || "");
      setValue("brand", initialData.brand || "");
      setValue("isActive", initialData.isActive);
      setValue("productType", initialData.productType);
      setValue("skillLevel", initialData.skillLevel);
      setValue("weightRange", initialData.weightRange);
      setValue("surfaceType", initialData.surfaceType);
      setValue("material", initialData.material || "");
    }
  }, [initialData, setValue]);

  return (
    <form
      onSubmit={handleSubmit((values) =>
        onSubmit({
          ...values,
          productType: Number(values.productType),
          skillLevel: Number(values.skillLevel),
          weightRange: Number(values.weightRange),
          surfaceType: Number(values.surfaceType),
          originalPrice: values.originalPrice === undefined ? null : values.originalPrice,
        })
      )}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Tên sản phẩm</Label>
          <Input {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div>
          <Label>Slug (đường dẫn)</Label>
          <Input {...register("slug")} />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Danh mục</Label>
          <Select
            {...register("categoryId")}
            defaultValue={initialData?.categoryId || ""}
          >
            <SelectItem value="">Chọn danh mục</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-destructive">
              {errors.categoryId.message}
            </p>
          )}
        </div>
        <div>
          <Label>Thương hiệu</Label>
          <Input {...register("brand")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Giá bán</Label>
          <Input type="number" step="0.01" {...register("price", { valueAsNumber: true })} />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
        <div>
          <Label>Giá gốc (nếu có)</Label>
          <Input
            type="number"
            step="0.01"
            {...register("originalPrice", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Tồn kho</Label>
          <Input type="number" {...register("stockQuantity", { valueAsNumber: true })} />
        </div>
        <div>
          <Label>Mã SKU</Label>
          <Input {...register("sku")} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Loại sản phẩm</Label>
          <Select
            {...register("productType")}
            defaultValue={String(initialData?.productType ?? 1)}
          >
            {productTypeOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div>
          <Label>Trình độ người chơi</Label>
          <Select
            {...register("skillLevel")}
            defaultValue={String(initialData?.skillLevel ?? 1)}
          >
            {skillLevelOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Độ nặng</Label>
          <Select
            {...register("weightRange")}
            defaultValue={String(initialData?.weightRange ?? 2)}
          >
            {weightOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div>
          <Label>Chất liệu bề mặt</Label>
          <Select
            {...register("surfaceType")}
            defaultValue={String(initialData?.surfaceType ?? 1)}
          >
            {surfaceOptions.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Chất liệu thân</Label>
        <Input {...register("material")} />
      </div>

      <div>
        <Label>Mô tả</Label>
        <Textarea rows={4} {...register("description")} />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          className="h-4 w-4"
          defaultChecked={initialData?.isActive ?? true}
          onChange={(e) => setValue("isActive", e.target.checked)}
        />
        <Label htmlFor="isActive">Kích hoạt sản phẩm</Label>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Đang lưu..." : "Lưu sản phẩm"}
      </Button>
    </form>
  );
}

