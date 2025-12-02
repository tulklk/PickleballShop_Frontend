"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem } from "@/components/ui/select";
import type { Product, ProductCategory, ProductVariantDto, ProductDto } from "@/lib/api/types";
import { X, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { VariantFormItem, ProductVariantFormData } from "@/components/admin/VariantFormItem";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export type ProductFormValues = z.infer<typeof productSchema> & {
  variants?: ProductVariantFormData[] | null;
};

interface ProductFormProps {
  categories: ProductCategory[] | undefined;
  initialData?: Product | ProductDto | null;
  onSubmit: (values: ProductFormValues & { variants?: ProductVariantFormData[] | null }) => Promise<void>;
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
  
  // State for managing variants
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<ProductVariantFormData[]>([]);
  const [variantCountInput, setVariantCountInput] = useState<string>("");

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
      
      // Load variants if product has variants
      const productDto = initialData as ProductDto;
      if (productDto.hasVariants && productDto.variants && productDto.variants.length > 0) {
        setHasVariants(true);
        const initialVariants: ProductVariantFormData[] = productDto.variants.map((v) => ({
          id: v.id,
          color: v.color || null,
          size: v.size || null,
          spec: v.spec || null,
          price: v.price,
          originalPrice: v.originalPrice || null,
          stockQuantity: v.stockQuantity,
          sku: v.sku || "",
          isActive: v.isActive,
        }));
        setVariants(initialVariants);
        // Set stock to 0 when has variants
        setValue("stockQuantity", 0);
      } else {
        setHasVariants(false);
        setVariants([]);
      }
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

  // Variants management functions
  const addVariant = () => {
    const currentPrice = watch("price") || 0;
    const currentOriginalPrice = watch("originalPrice");
    
    const newVariant: ProductVariantFormData = {
      color: null,
      size: null,
      spec: null,
      price: currentPrice,
      originalPrice: currentOriginalPrice || null,
      stockQuantity: 0,
      sku: "",
      isActive: true,
    };
    
    setVariants([...variants, newVariant]);
  };

  const addMultipleVariants = () => {
    const count = parseInt(variantCountInput);
    
    // Validate input
    if (isNaN(count) || count < 1 || count > 50) {
      toast.error("Vui lòng nhập số lượng từ 1 đến 50");
      return;
    }
    
    const currentPrice = watch("price") || 0;
    const currentOriginalPrice = watch("originalPrice");
    
    // Create multiple variants
    const newVariants: ProductVariantFormData[] = Array.from({ length: count }, () => ({
      color: null,
      size: null,
      spec: null,
      price: currentPrice,
      originalPrice: currentOriginalPrice || null,
      stockQuantity: 0,
      sku: "",
      isActive: true,
    }));
    
    setVariants([...variants, ...newVariants]);
    setVariantCountInput(""); // Clear input after creating
    toast.success(`Đã tạo ${count} variant${count > 1 ? 's' : ''}`);
  };

  const toggleVariants = () => {
    const newHasVariants = !hasVariants;
    setHasVariants(newHasVariants);
    
    if (newHasVariants) {
      // Enable variants - set stock to 0
      setValue("stockQuantity", 0);
      if (variants.length === 0) {
        // Add first variant if none exists
        const currentPrice = watch("price") || 0;
        const currentOriginalPrice = watch("originalPrice");
        
        const newVariant: ProductVariantFormData = {
          color: null,
          size: null,
          spec: null,
          price: currentPrice,
          originalPrice: currentOriginalPrice || null,
          stockQuantity: 0,
          sku: "",
          isActive: true,
        };
        setVariants([newVariant]);
      }
    } else {
      // Disable variants - clear variants array
      setVariants([]);
    }
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof ProductVariantFormData, value: any) => {
    const updated = variants.map((variant, i) => 
      i === index ? { ...variant, [field]: value } : variant
    );
    setVariants(updated);
  };

  // Validate variants
  const validateVariants = (): string | null => {
    if (!hasVariants) return null;
    
    if (variants.length === 0) {
      return "Vui lòng thêm ít nhất một variant khi bật tính năng variants";
    }
    
    const stockQuantity = watch("stockQuantity");
    if (stockQuantity !== 0) {
      return "Stock quantity phải = 0 khi product có variants";
    }
    
    // Validate each variant
    for (let i = 0; i < variants.length; i++) {
      const variant = variants[i];
      
      // At least one attribute required
      if (!variant.color && !variant.size && !variant.spec) {
        return `Variant ${i + 1} phải có ít nhất một thuộc tính (Color, Size, hoặc Spec)`;
      }
      
      // SKU required
      if (!variant.sku || variant.sku.trim() === "") {
        return `Variant ${i + 1} phải có SKU`;
      }
      
      // Price must be > 0
      if (variant.price <= 0) {
        return `Variant ${i + 1} phải có giá lớn hơn 0`;
      }
      
      // Stock quantity must be >= 0
      if (variant.stockQuantity < 0) {
        return `Variant ${i + 1} có số lượng tồn kho không hợp lệ`;
      }
    }
    
    // Check duplicate SKUs
    const skus = variants.map(v => v.sku.trim().toLowerCase()).filter(Boolean);
    const uniqueSkus = new Set(skus);
    if (skus.length !== uniqueSkus.size) {
      return "Variant SKUs không được trùng nhau";
    }
    
    return null;
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
    
    // Validate variants
    const variantError = validateVariants();
    if (variantError) {
      toast.error(variantError);
      return;
    }
    
    try {
      // Always use state imageUrls as source of truth (it's updated when upload/remove)
      // Filter to ensure all are valid strings
      const finalImageUrls: string[] = Array.isArray(imageUrls)
        ? imageUrls.filter((url): url is string => 
            typeof url === "string" && url.trim().length > 0 && url.startsWith("http")
          )
        : [];
      
      // Ensure all data types are correct
      const submitData: ProductFormValues & { variants?: ProductVariantFormData[] | null } = {
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
        // Add variants data
        variants: hasVariants ? variants : null,
      };
      
      console.log("=== Final Submit Data ===");
      console.log("Submit data:", JSON.stringify(submitData, null, 2));
      console.log("Variants:", {
        hasVariants,
        variantsCount: variants.length,
        variants: variants,
      });
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
          <Label>Danh mục *</Label>
          <Select
            value={categoryId || ""}
            onValueChange={(value) => {
              setValue("categoryId", value, { shouldValidate: true });
            }}
          >
            <SelectItem value="" disabled>
              Chọn danh mục
            </SelectItem>
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name || category.id}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="" disabled>
                Không có danh mục nào
              </SelectItem>
            )}
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-destructive mt-1">
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
          <Input 
            type="number" 
            {...register("stockQuantity", { valueAsNumber: true })} 
            disabled={hasVariants}
          />
          {hasVariants && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Stock quantity đã được tự động set = 0 vì product có variants
            </p>
          )}
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

      {/* Variants Toggle */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center gap-2">
          <Switch
            id="hasVariants"
            checked={hasVariants}
            onCheckedChange={toggleVariants}
          />
          <Label htmlFor="hasVariants" className="text-base font-semibold cursor-pointer">
            Sản phẩm có variants (màu sắc, size, thông số)
          </Label>
        </div>
      </div>

      {/* Variants Section */}
      {hasVariants && (
        <Card className="border-2 border-emerald-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg">Quản lý Variants</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  onClick={addVariant}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Thêm 1 Variant
                </Button>
              </div>
            </div>
            {/* Bulk Create Variants */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <Label htmlFor="variantCount" className="text-sm font-medium whitespace-nowrap">
                Tạo nhiều variants cùng lúc:
              </Label>
              <Input
                id="variantCount"
                type="number"
                min="1"
                max="50"
                placeholder="Số lượng"
                value={variantCountInput}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || (parseInt(value) >= 1 && parseInt(value) <= 50)) {
                    setVariantCountInput(value);
                  }
                }}
                className="w-24"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMultipleVariants();
                  }
                }}
              />
              <span className="text-xs text-gray-500 whitespace-nowrap">(tối đa 50)</span>
              <Button
                type="button"
                onClick={addMultipleVariants}
                variant="default"
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700"
                disabled={!variantCountInput || parseInt(variantCountInput) < 1 || parseInt(variantCountInput) > 50}
              >
                <Plus className="h-4 w-4" />
                {variantCountInput && parseInt(variantCountInput) > 0
                  ? `Tạo ${variantCountInput} Variant${parseInt(variantCountInput) > 1 ? "s" : ""}`
                  : "Tạo Variants"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {variants.length > 0 ? (
              variants.map((variant, index) => (
                <VariantFormItem
                  key={index}
                  variant={variant}
                  index={index}
                  basePrice={watch("price") || 0}
                  baseOriginalPrice={watch("originalPrice")}
                  onChange={(field, value) => updateVariant(index, field, value)}
                  onRemove={() => removeVariant(index)}
                />
              ))
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">Chưa có variant nào. Vui lòng thêm ít nhất một variant.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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

