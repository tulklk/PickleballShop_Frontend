"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCategories, useAdminCreateProduct } from "@/lib/api/hooks";
import { ProductForm, ProductFormValues } from "../ProductForm";
import { toast } from "sonner";

export default function AdminProductCreatePage() {
  const router = useRouter();
  const { data: categories } = useAdminCategories();
  const createProduct = useAdminCreateProduct();

  const handleSubmit = async (values: ProductFormValues) => {
    console.log("═══════════════════════════════════════════════════════");
    console.log("➕ CREATE PRODUCT - START");
    console.log("═══════════════════════════════════════════════════════");
    console.log("📝 Form Values Received:", JSON.stringify(values, null, 2));
    console.log("📝 Form Values Types:", {
      name: typeof values.name,
      description: typeof values.description,
      categoryId: typeof values.categoryId,
      price: typeof values.price,
      originalPrice: typeof values.originalPrice,
      stockQuantity: typeof values.stockQuantity,
      sku: typeof values.sku,
      brand: typeof values.brand,
      isActive: typeof values.isActive,
      imageUrls: typeof values.imageUrls,
      imageUrlsIsArray: Array.isArray(values.imageUrls),
      imageUrlsLength: Array.isArray(values.imageUrls) ? values.imageUrls.length : "N/A",
    });
    
    try {
      // Validate categoryId before proceeding
      const finalCategoryId = values.categoryId || "";
      if (!finalCategoryId || finalCategoryId.trim() === "") {
        console.error("❌ Category ID is missing in create!");
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
      
      // Only send fields that backend supports
      // Ensure all numeric values are numbers, not strings
      const productData: any = {
        name: values.name || "",
        description: values.description || null,
        categoryId: finalCategoryId,
        price: typeof values.price === "number" ? values.price : Number(values.price) || 0,
        originalPrice: values.originalPrice !== undefined && values.originalPrice !== null 
          ? (typeof values.originalPrice === "number" ? values.originalPrice : Number(values.originalPrice))
          : null,
        stockQuantity: typeof values.stockQuantity === "number" ? values.stockQuantity : Number(values.stockQuantity) || 0,
        sku: values.sku || null,
        brand: values.brand || null,
        isActive: values.isActive === true || values.isActive === "true",
        // Always include imageUrls as array of valid strings (even if empty)
        imageUrls: Array.isArray(values.imageUrls) 
          ? values.imageUrls.filter((url): url is string => 
              typeof url === "string" && url.trim().length > 0
            )
          : [],
      };
      
      console.log("📤 Prepared Product Data:", JSON.stringify(productData, null, 2));
      console.log("📊 Data Types Check:", {
        name: typeof productData.name,
        description: typeof productData.description,
        categoryId: typeof productData.categoryId,
        price: typeof productData.price,
        originalPrice: typeof productData.originalPrice,
        stockQuantity: typeof productData.stockQuantity,
        sku: typeof productData.sku,
        brand: typeof productData.brand,
        isActive: typeof productData.isActive,
        imageUrls: typeof productData.imageUrls,
        imageUrlsIsArray: Array.isArray(productData.imageUrls),
        imageUrlsLength: productData.imageUrls.length,
        imageUrlsContent: productData.imageUrls,
      });
      console.log("🔍 Category ID Validation:", {
        categoryId: productData.categoryId,
        isEmpty: !productData.categoryId || productData.categoryId === "",
        isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productData.categoryId || ""),
      });
      
      await createProduct.mutateAsync(productData);
      
      console.log("✅ CREATE PRODUCT - SUCCESS");
      console.log("═══════════════════════════════════════════════════════");
      toast.success("Tạo sản phẩm thành công");
      router.push("/admin/products");
    } catch (error: any) {
      console.error("❌ CREATE PRODUCT - ERROR");
      console.error("Error object:", error);
      console.error("Error message:", error?.message);
      console.error("Error status:", error?.status);
      console.error("Error data:", JSON.stringify(error?.data, null, 2));
      console.error("Error stack:", error?.stack);
      
      // Log validation errors if available
      if (error?.data?.errors) {
        console.error("🔴 Validation Errors:", JSON.stringify(error.data.errors, null, 2));
      }
      if (error?.data?.title) {
        console.error("🔴 Error Title:", error.data.title);
      }
      
      console.log("═══════════════════════════════════════════════════════");
      const errorMessage = error?.data?.message || error?.message || error?.data?.error || "Không thể tạo sản phẩm";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Tạo sản phẩm mới</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            categories={categories}
            onSubmit={handleSubmit}
            loading={createProduct.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}

