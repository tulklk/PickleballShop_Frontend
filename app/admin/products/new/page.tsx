"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminCategories, useAdminCreateProduct, useAdminBulkUpdateProductSpecifications } from "@/lib/api/hooks";
import { ProductForm, ProductFormValues } from "../ProductForm";
import { ProductSpecificationsDraft, type DraftSpec } from "@/components/admin/ProductSpecificationsDraft";
import { toast } from "sonner";
import { coerceStockQuantity } from "@/lib/utils/productFormUtils";
import { DEBUG_API } from "@/lib/utils/debugApi";

const _c = globalThis.console;
function devLog(...args: unknown[]) {
  if (DEBUG_API) _c.log(...args);
}
function devWarn(...args: unknown[]) {
  if (DEBUG_API) _c.warn(...args);
}
function devError(...args: unknown[]) {
  if (DEBUG_API) _c.error(...args);
}

export default function AdminProductCreatePage() {
  const router = useRouter();
  const { data: categories } = useAdminCategories();
  const createProduct = useAdminCreateProduct();
  const bulkUpdateSpecs = useAdminBulkUpdateProductSpecifications();
  const [draftSpecs, setDraftSpecs] = useState<DraftSpec[]>([]);

  const handleSubmit = async (values: ProductFormValues) => {
    devLog("═══════════════════════════════════════════════════════");
    devLog("➕ CREATE PRODUCT - START");
    devLog("═══════════════════════════════════════════════════════");
    devLog("📝 Form Values Received:", JSON.stringify(values, null, 2));
    devLog("📝 Form Values Types:", {
      name: typeof values.name,
      description: typeof values.description,
      categoryId: typeof values.categoryId,
      price: typeof values.price,
      originalPrice: typeof values.originalPrice,
      stockQuantity: typeof values.stockQuantity,
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
        devError("❌ Category ID is missing in create!");
        toast.error("Vui lòng chọn danh mục sản phẩm");
        return;
      }
      
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(finalCategoryId)) {
        devError("❌ Category ID is not a valid UUID:", finalCategoryId);
        toast.error("Danh mục không hợp lệ. Vui lòng chọn lại danh mục.");
        return;
      }
      
      // Only send fields that backend supports
      // Ensure all numeric values are numbers, not strings
      const productData: any = {
        name: values.name || "",
        description: values.description || null,
        categoryId: finalCategoryId,
        price: typeof values.price === "number" && !Number.isNaN(values.price) ? values.price : Number(values.price) || 0,
        originalPrice:
          values.originalPrice !== undefined &&
          values.originalPrice !== null &&
          !Number.isNaN(Number(values.originalPrice))
            ? (typeof values.originalPrice === "number" ? values.originalPrice : Number(values.originalPrice))
            : null,
        stockQuantity: coerceStockQuantity(values.stockQuantity),
        brand: values.brand || null,
        isActive:
          typeof values.isActive === "string"
            ? values.isActive === "true"
            : Boolean(values.isActive),
        // Always include imageUrls as array of valid strings (even if empty)
        imageUrls: Array.isArray(values.imageUrls) 
          ? values.imageUrls.filter((url): url is string => 
              typeof url === "string" && url.trim().length > 0
            )
          : [],
      };

      // Handle variants
      if (values.variants !== undefined && values.variants !== null) {
        if (values.variants.length === 0) {
          // Empty array = no variants
          productData.variants = null;
        } else {
          // Map variants to backend format (remove id if exists for create)
          // Ensure all required fields are present and valid
          productData.variants = values.variants.map((v) => {
            return {
              color: v.color?.trim() || null,
              size: v.size?.trim() || null,
              spec: v.spec?.trim() || null,
              price: typeof v.price === "number" ? v.price : Number(v.price) || 0,
              originalPrice: v.originalPrice !== undefined && v.originalPrice !== null
                ? (typeof v.originalPrice === "number" ? v.originalPrice : Number(v.originalPrice))
                : null,
              stockQuantity: coerceStockQuantity(v.stockQuantity),
              isActive: Boolean(v.isActive),
            };
          });
        }
      } else {
        // null or undefined = no variants
        productData.variants = null;
      }
      
      devLog("📤 Prepared Product Data:", JSON.stringify(productData, null, 2));
      devLog("📊 Data Types Check:", {
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
      devLog("🔍 Category ID Validation:", {
        categoryId: productData.categoryId,
        isEmpty: !productData.categoryId || productData.categoryId === "",
        isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productData.categoryId || ""),
      });
      
      const created = await createProduct.mutateAsync(productData);
      
      if (draftSpecs.length > 0 && created?.id) {
        try {
          await bulkUpdateSpecs.mutateAsync({
            productId: created.id,
            data: {
              specifications: draftSpecs.map((s, i) => ({
                key: s.key,
                value: s.value,
                displayOrder: i + 1,
              })),
            },
          });
        } catch (specError: any) {
          toast.error(specError?.message || "Tạo sản phẩm thành công nhưng không lưu được thông số kỹ thuật.");
        }
      }
      
      devLog("✅ CREATE PRODUCT - SUCCESS");
      devLog("═══════════════════════════════════════════════════════");
      toast.success("Tạo sản phẩm thành công");
      
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/admin/products");
    } catch (error: any) {
      devWarn("❌ CREATE PRODUCT - ERROR");
      devWarn("Error object:", error);
      devWarn("Error message:", error?.message);
      devWarn("Error status:", error?.status);
      devWarn("Error data:", JSON.stringify(error?.data, null, 2));
      
      // Handle 401 Unauthorized - redirect to login
      if (error?.status === 401) {
        devWarn("🔴 Authentication failed - redirecting to login");
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          router.push("/login?redirect=/admin/products/new");
        }, 1500);
        return;
      }
      
      // Handle 500 Internal Server Error - show detailed error
      if (error?.status === 500) {
        devWarn("🔴 Server Error (500):", error?.data);
        
        // Try to extract detailed error message
        let serverErrorMessage = "Lỗi máy chủ. Vui lòng kiểm tra dữ liệu và thử lại.";
        
        if (error?.data) {
          // Check for validation errors in the response
          if (error.data.errors) {
            const validationErrors: string[] = [];
            for (const [key, value] of Object.entries(error.data.errors)) {
              if (Array.isArray(value)) {
                validationErrors.push(`${key}: ${value.join(", ")}`);
              } else if (typeof value === "string") {
                validationErrors.push(`${key}: ${value}`);
              }
            }
            if (validationErrors.length > 0) {
              serverErrorMessage = "Lỗi dữ liệu: " + validationErrors.join("; ");
              if (/Description.*5000|5000.*character/i.test(serverErrorMessage)) {
                serverErrorMessage += " — Để dùng mô tả dài hơn 5.000 ký tự, cần tăng giới hạn trường Description ở backend (API).";
              }
            }
          }
          
          // Check for other error fields
          if (error.data.message) {
            serverErrorMessage = error.data.message;
          } else if (error.data.error) {
            serverErrorMessage = error.data.error;
          } else if (error.data.detail) {
            serverErrorMessage = error.data.detail;
          } else if (error.data.title) {
            serverErrorMessage = error.data.title;
          }
        }
        
        toast.error(serverErrorMessage);
        return;
      }
      
      // Log validation errors if available
      if (error?.data?.errors) {
        devWarn("🔴 Validation Errors:", JSON.stringify(error.data.errors, null, 2));
        // Format validation errors for display
        const validationErrors: string[] = [];
        for (const [key, value] of Object.entries(error.data.errors)) {
          if (Array.isArray(value)) {
            validationErrors.push(`${key}: ${value.join(", ")}`);
          } else if (typeof value === "string") {
            validationErrors.push(`${key}: ${value}`);
          }
        }
        if (validationErrors.length > 0) {
          let msg = "Lỗi dữ liệu: " + validationErrors.join("; ");
          if (/Description.*5000|5000.*character/i.test(msg)) {
            msg += " — Để dùng mô tả dài hơn 5.000 ký tự, cần tăng giới hạn trường Description ở backend (API).";
          }
          toast.error(msg);
          return;
        }
      }
      if (error?.data?.title) {
        devWarn("🔴 Error Title:", error.data.title);
      }
      
      devLog("═══════════════════════════════════════════════════════");
      const errorMessage = error?.data?.message || error?.message || error?.data?.error || "Không thể tạo sản phẩm";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
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

      <ProductSpecificationsDraft value={draftSpecs} onChange={setDraftSpecs} />
    </div>
  );
}

