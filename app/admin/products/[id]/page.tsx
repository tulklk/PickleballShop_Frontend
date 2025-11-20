"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useAdminCategories,
  useAdminProduct,
  useAdminUpdateProduct,
} from "@/lib/api/hooks";
import { ProductForm, ProductFormValues } from "../ProductForm";
import { toast } from "sonner";

export default function AdminProductEditPage() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const { data: product, isLoading } = useAdminProduct(productId);
  const { data: categories } = useAdminCategories();
  const updateProduct = useAdminUpdateProduct();

  const handleSubmit = async (values: ProductFormValues) => {
    if (!productId) return;
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
      toast.success("Product updated successfully");
      router.push("/admin/products");
    } catch (error) {
      toast.error("Failed to update product");
    }
  };

  if (isLoading || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading product...</div>
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

