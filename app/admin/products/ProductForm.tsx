"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Product, ProductCategory } from "@/lib/api/types";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

const productSchema = z.object({
  name: z.string().min(1, "Tên sản phẩm là bắt buộc"),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
  price: z.number().min(0, "Giá phải lớn hơn hoặc bằng 0"),
  originalPrice: z.number().nullable().optional(),
  stockQuantity: z.number().int().min(0, "Tồn kho phải lớn hơn hoặc bằng 0"),
  sku: z.string().optional().nullable(),
  brand: z.string().optional().nullable(),
  isActive: z.boolean(),
  imageUrls: z.array(z.string().url("URL không hợp lệ")).optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

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
    watch,
    control,
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: undefined,
      categoryId: "",
      price: 0,
      originalPrice: undefined,
      stockQuantity: 0,
      sku: undefined,
      brand: undefined,
      isActive: true,
      imageUrls: [],
    },
  });

  // Watch form values for Select components
  const categoryId = watch("categoryId");
  const watchedImageUrls = watch("imageUrls");
  
  // Sync watched imageUrls with state when form values change externally
  useEffect(() => {
    if (Array.isArray(watchedImageUrls) && watchedImageUrls.length !== imageUrls.length) {
      const validUrls = watchedImageUrls.filter((url): url is string => 
        typeof url === "string" && url.trim().length > 0
      );
      if (JSON.stringify(validUrls) !== JSON.stringify(imageUrls)) {
        console.log("Syncing imageUrls from form to state:", validUrls);
        setImageUrls(validUrls);
      }
    }
  }, [watchedImageUrls]);

  // State for managing image URLs
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.name || "");
      setValue("description", initialData.description || "");
      
      // Ensure categoryId is a valid UUID string
      const categoryId = initialData.categoryId || "";
      if (categoryId && typeof categoryId === 'string') {
        setValue("categoryId", categoryId, { shouldValidate: true, shouldDirty: true });
        console.log("Set initial categoryId:", categoryId);
      } else {
        console.warn("Invalid categoryId:", categoryId);
      }
      
      setValue("price", initialData.price);
      setValue("originalPrice", initialData.originalPrice ?? undefined);
      setValue("stockQuantity", initialData.stockQuantity);
      setValue("sku", initialData.sku || "");
      setValue("brand", initialData.brand || "");
      setValue("isActive", initialData.isActive);
      
      // Load imageUrls from initialData (if it has imageUrls property)
      const initialImageUrls = (initialData as any).imageUrls || [];
      // Ensure all URLs are valid strings
      const validImageUrls = Array.isArray(initialImageUrls) 
        ? initialImageUrls.filter((url): url is string => 
            typeof url === "string" && url.trim().length > 0
          )
        : [];
      setImageUrls(validImageUrls);
      setValue("imageUrls", validImageUrls, { shouldValidate: true });
      console.log("Loaded initial imageUrls:", validImageUrls);
    }
  }, [initialData, setValue]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith("image/")) {
          throw new Error(`File ${file.name} không phải là hình ảnh`);
        }

        // Validate file size (max 5MB for better performance)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`File ${file.name} quá lớn (tối đa 5MB). Vui lòng nén ảnh trước khi upload.`);
        }

        const formData = new FormData();
        formData.append("file", file);

        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Lỗi khi upload ảnh");
          }

          const data = await response.json();
          return data.url;
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === "AbortError") {
            throw new Error("Upload timeout - ảnh quá lớn hoặc kết nối chậm");
          }
          throw error;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      // Filter out any invalid URLs and ensure all are strings
      const validUrls = uploadedUrls.filter((url): url is string => 
        typeof url === "string" && url.trim().length > 0
      );
      
      const updated = [...imageUrls, ...validUrls];
      setImageUrls(updated);
      setValue("imageUrls", updated, { shouldValidate: true });
      
      console.log("Uploaded URLs:", validUrls);
      console.log("Updated imageUrls:", updated);
      
      toast.success(`Đã upload ${validUrls.length} ảnh thành công`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Lỗi khi upload ảnh");
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = "";
    }
  };

  const removeImageUrl = (index: number) => {
    const updated = imageUrls.filter((_, i) => i !== index);
    setImageUrls(updated);
    setValue("imageUrls", updated, { shouldValidate: true });
    console.log("Removed image, updated imageUrls:", updated);
  };

  const onSubmitForm = async (values: ProductFormValues) => {
    console.log("=== Form Submit ===");
    console.log("Form values:", JSON.stringify(values, null, 2));
    console.log("Image URLs state (current):", imageUrls);
    console.log("Image URLs from form values:", values.imageUrls);
    console.log("Category ID from form values:", values.categoryId);
    console.log("Category ID from watch:", categoryId);
    console.log("Category ID type:", typeof values.categoryId);
    console.log("Category ID isEmpty:", !values.categoryId || values.categoryId === "");
    
    // Validate categoryId before submit - use form values from Controller
    const finalCategoryId = values.categoryId || "";
    if (!finalCategoryId || finalCategoryId.trim() === "") {
      console.error("❌ Category ID is missing in form values!");
      console.error("Form values.categoryId:", values.categoryId);
      console.error("Watch categoryId:", categoryId);
      toast.error("Vui lòng chọn danh mục sản phẩm");
      return;
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(finalCategoryId)) {
      console.error("❌ Category ID is not a valid UUID:", finalCategoryId);
      toast.error("Danh mục không hợp lệ. Vui lòng chọn lại danh mục.");
      return;
    }
    
    console.log("✅ Category ID validated:", finalCategoryId);
    
    try {
      // Always use state imageUrls as source of truth (it's updated when upload/remove)
      // Filter to ensure all are valid strings
      const finalImageUrls: string[] = Array.isArray(imageUrls)
        ? imageUrls.filter((url): url is string => 
            typeof url === "string" && url.trim().length > 0 && url.startsWith("http")
          )
        : [];
      
      // Ensure all data types are correct
      const submitData: ProductFormValues = {
        ...values,
        // Ensure categoryId is valid and not empty
        categoryId: finalCategoryId,
        // Ensure numbers are actually numbers
        price: typeof values.price === "number" ? values.price : Number(values.price) || 0,
        originalPrice: values.originalPrice !== undefined && values.originalPrice !== null
          ? (typeof values.originalPrice === "number" ? values.originalPrice : Number(values.originalPrice))
          : null,
        stockQuantity: typeof values.stockQuantity === "number" ? values.stockQuantity : Number(values.stockQuantity) || 0,
        // Always use state imageUrls (source of truth)
        imageUrls: finalImageUrls,
      };
      
      console.log("=== Final Submit Data ===");
      console.log("Submit data:", JSON.stringify(submitData, null, 2));
      console.log("Category ID validation:", {
        value: submitData.categoryId,
        isEmpty: !submitData.categoryId || submitData.categoryId === "",
        isValidUUID: uuidRegex.test(submitData.categoryId),
      });
      console.log("ImageUrls:", {
        type: typeof submitData.imageUrls,
        isArray: Array.isArray(submitData.imageUrls),
        length: submitData.imageUrls?.length || 0,
        content: submitData.imageUrls,
      });
      
      await onSubmit(submitData);
    } catch (error) {
      console.error("Form submission error:", error);
      // Error is already handled in parent component
      throw error; // Re-throw to let parent handle it
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className="space-y-6"
    >
      <div>
        <Label>Tên sản phẩm</Label>
        <Input {...register("name")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Danh mục (Category ID) *</Label>
          <Input 
            {...register("categoryId")} 
            placeholder="Nhập Category ID (UUID)"
            type="text"
          />
          {errors.categoryId && (
            <p className="text-sm text-destructive">
              {errors.categoryId.message}
            </p>
          )}
          {categories && categories.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Gợi ý: {categories.map((cat, idx) => (
                <span key={cat.id}>
                  {cat.name} ({cat.id}){idx < categories.length - 1 ? ", " : ""}
                </span>
              ))}
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

      <div>
        <Label>Mô tả</Label>
        <Textarea rows={4} {...register("description")} />
      </div>

      <div>
        <Label>Hình ảnh sản phẩm</Label>
        <div className="space-y-2">
          <div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="image-upload"
            />
            <Label
              htmlFor="image-upload"
              className="cursor-pointer inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Đang upload...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Chọn ảnh từ máy tính
                </>
              )}
            </Label>
            <p className="text-xs text-muted-foreground mt-1">
              Có thể chọn nhiều ảnh cùng lúc. Tối đa 5MB mỗi ảnh (khuyến nghị &lt; 2MB để upload nhanh hơn).
            </p>
          </div>
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden border">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImageUrl(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        {errors.imageUrls && (
          <p className="text-sm text-destructive">{errors.imageUrls.message}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          className="h-4 w-4"
          checked={watch("isActive")}
          onChange={(e) => setValue("isActive", e.target.checked)}
        />
        <Label htmlFor="isActive">Kích hoạt sản phẩm</Label>
      </div>

      <Button type="submit" disabled={loading || uploading}>
        {loading ? "Đang lưu..." : "Lưu sản phẩm"}
      </Button>
      
      {Object.keys(errors).length > 0 && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm font-semibold text-destructive mb-2">
            Vui lòng sửa các lỗi sau:
          </p>
          <ul className="text-sm text-destructive space-y-1">
            {Object.entries(errors).map(([key, error]) => (
              <li key={key}>
                {key}: {error?.message || "Lỗi không xác định"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

