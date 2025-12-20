"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAdminCategories,
  useAdminProduct,
  useAdminUpdateProduct,
  useProduct,
} from "@/lib/api/hooks";
import { ProductForm, ProductFormValues } from "../ProductForm";
import { ProductSpecifications } from "@/components/admin/ProductSpecifications";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/useAuth";
import { Button } from "@/components/ui/button";

export default function AdminProductEditPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const { isAdmin } = useAuth();
  const { 
    data: adminProduct, 
    isLoading: isLoadingAdmin, 
    isError: isAdminError 
  } = useAdminProduct(productId);
  const { 
    data: publicProduct, 
    isLoading: isLoadingPublic 
  } = useProduct(productId);
  const { data: categories } = useAdminCategories();
  const updateProduct = useAdminUpdateProduct();

  // Use admin product if available, otherwise fallback to public product
  const product = adminProduct || publicProduct;
  const isLoading = isLoadingAdmin || isLoadingPublic;

  const handleSubmit = async (values: ProductFormValues) => {
    if (!productId) {
      toast.error("Không tìm thấy ID sản phẩm");
      return;
    }
    
    if (!isAdmin) {
      toast.error("Bạn cần đăng nhập bằng tài khoản admin để chỉnh sửa sản phẩm");
      return;
    }
    
    console.log("═══════════════════════════════════════════════════════");
    console.log("🔄 UPDATE PRODUCT - START");
    console.log("═══════════════════════════════════════════════════════");
    console.log("📋 Product ID:", productId);
    console.log("📝 Form Values Received:", JSON.stringify(values, null, 2));
    console.log("📝 Form Values Types:", {
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
        console.error("❌ Category ID is missing in update!");
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
      
      // Only send fields that backend supports (based on Swagger UI schema)
      // Ensure all numeric values are numbers, not strings
      const productData: any = {
        name: values.name || "",
        description: values.description || null,
        categoryId: finalCategoryId.trim(), // Ensure no whitespace
        price: typeof values.price === "number" ? values.price : Number(values.price) || 0,
        originalPrice: values.originalPrice !== undefined && values.originalPrice !== null 
          ? (typeof values.originalPrice === "number" ? values.originalPrice : Number(values.originalPrice))
          : null,
        stockQuantity: typeof values.stockQuantity === "number" ? values.stockQuantity : Number(values.stockQuantity) || 0,
        brand: values.brand || null,
        isActive: Boolean(values.isActive),
        // Always include imageUrls as array of valid strings (even if empty)
        imageUrls: Array.isArray(values.imageUrls) 
          ? values.imageUrls.filter((url): url is string => 
              typeof url === "string" && url.trim().length > 0
            )
          : [],
      };

      // Handle variants for update:
      // - If variants is null/undefined: don't send variants field = keep existing variants
      // - If variants is []: send variants = [] = remove all variants
      // - If variants is [...]: send variants = [...] = replace all variants
      if (values.variants !== undefined) {
        if (values.variants === null) {
          // null means user disabled variants - remove all variants
          productData.variants = [];
        } else if (Array.isArray(values.variants)) {
          if (values.variants.length === 0) {
            // Empty array = remove all variants
            productData.variants = [];
          } else {
            // Map variants to backend format (remove id for update - backend will replace all)
            productData.variants = values.variants.map((v) => ({
              color: v.color || null,
              size: v.size || null,
              spec: v.spec || null,
              price: v.price,
              originalPrice: v.originalPrice || null,
              stockQuantity: v.stockQuantity,
              sku: v.sku?.trim() || "",
              isActive: v.isActive,
            }));
          }
        }
        // If variants is undefined, don't add variants field = keep existing variants
      }
      
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
      
      await updateProduct.mutateAsync({
        id: productId,
        data: productData,
      });
      
      console.log("✅ UPDATE PRODUCT - SUCCESS");
      console.log("═══════════════════════════════════════════════════════");
      toast.success("Cập nhật sản phẩm thành công");
      
      // Wait a bit to ensure cache is updated before redirecting
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push("/admin/products");
    } catch (error: any) {
      console.warn("❌ UPDATE PRODUCT - ERROR");
      console.warn("Error object:", error);
      console.warn("Error message:", error?.message);
      console.warn("Error status:", error?.status);
      console.warn("Error data:", JSON.stringify(error?.data, null, 2));
      
      // Handle 401 Unauthorized - redirect to login
      if (error?.status === 401) {
        console.warn("🔴 Authentication failed - redirecting to login");
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          router.push(`/login?redirect=/admin/products/${productId}`);
        }, 1500);
        return;
      }
      
      // Log validation errors if available
      if (error?.data?.errors) {
        console.warn("🔴 Validation Errors:", JSON.stringify(error.data.errors, null, 2));
      }
      if (error?.data?.title) {
        console.warn("🔴 Error Title:", error.data.title);
      }
      
      console.log("═══════════════════════════════════════════════════════");
      const errorMessage = error?.data?.message || error?.message || error?.data?.error || "Không thể cập nhật sản phẩm";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Đang tải sản phẩm...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-2">Không tìm thấy sản phẩm</p>
            {isAdminError && !isAdmin && (
              <p className="text-sm text-muted-foreground">
                Bạn cần đăng nhập bằng tài khoản admin để chỉnh sửa sản phẩm.
              </p>
            )}
            <Button 
              variant="outline" 
              onClick={() => router.push("/admin/products")}
              className="mt-4"
            >
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Chỉnh sửa sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            categories={categories}
            initialData={product as any}
            onSubmit={handleSubmit}
            loading={updateProduct.isPending}
          />
        </CardContent>
      </Card>

      {/* Thông số kỹ thuật - chỉ hiển thị cho admin */}
      {isAdmin && (
        <ProductSpecifications productId={productId} />
      )}
    </div>
  );
}

