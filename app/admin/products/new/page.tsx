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
      await createProduct.mutateAsync({
        id: "",
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
      });
      toast.success("Product created successfully");
      router.push("/admin/products");
    } catch (error) {
      toast.error("Failed to create product");
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

