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
    if (!productId) return;
    
    if (!isAdmin) {
      toast.error("Bạn cần đăng nhập bằng tài khoản admin để chỉnh sửa sản phẩm");
      return;
    }
    
    try {
      await updateProduct.mutateAsync({
        id: productId,
        data: {
          id: productId,
          name: values.name,
          slug: values.slug,
          description: values.description || null,
          categoryId: values.categoryId,
          price: values.price,
          originalPrice: values.originalPrice ?? null,
          stockQuantity: values.stockQuantity,
          sku: values.sku || null,
          brand: values.brand || null,
          isActive: values.isActive,
          productType: values.productType as any,
          skillLevel: values.skillLevel as any,
          weightRange: values.weightRange as any,
          surfaceType: values.surfaceType as any,
          material: values.material || null,
        },
      });
      toast.success("Cập nhật sản phẩm thành công");
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Update product error:", error);
      const errorMessage = error?.message || error?.data?.message || "Không thể cập nhật sản phẩm";
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
    <div className="container mx-auto px-4 py-8">
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
    </div>
  );
}

