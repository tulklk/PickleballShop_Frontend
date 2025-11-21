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
    try {
      // Only send fields that backend supports
      const productData: any = {
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
      };
      
      // Only include imageUrls if there are images
      if (values.imageUrls && values.imageUrls.length > 0) {
        productData.imageUrls = values.imageUrls;
      }
      
      console.log("Product data to send:", productData);
      
      await createProduct.mutateAsync(productData);
      toast.success("Tạo sản phẩm thành công");
      router.push("/admin/products");
    } catch (error: any) {
      console.error("Create product error:", error);
      const errorMessage = error?.message || error?.data?.message || "Không thể tạo sản phẩm";
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

