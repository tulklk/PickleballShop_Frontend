"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useAdminProducts,
  useAdminDeleteProduct,
  useProducts,
} from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { toast } from "sonner";
import { PackagePlus, Trash2, Eye, Pencil, Package } from "lucide-react";
import type { Product, ProductListDto, ProductDto } from "@/lib/api/types";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";

export default function AdminProductsPage() {
  const { isAdmin } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>("");

  const {
    data: adminProducts,
    isLoading: isLoadingAdmin,
    isError: isAdminErrorQuery,
  } = useAdminProducts({
    enabled: isAdmin,
  });

  const { data: publicProducts, isLoading: isLoadingPublic } = useProducts({ Page: 1, PageSize: 1000 });
  const deleteProduct = useAdminDeleteProduct();

  // Prefer publicProducts (ProductListDto[]) because it has primaryImageUrl
  // Only use adminProducts if publicProducts is not available
  const normalizedProducts = (Array.isArray(publicProducts?.items) && publicProducts.items.length > 0
    ? publicProducts.items
    : Array.isArray(adminProducts) && adminProducts.length > 0
    ? adminProducts
    : []) as Array<Product | ProductListDto>;
  
  // Only show error if both admin and public products fail, and we're not still loading
  const showError = isAdminErrorQuery && !isLoadingAdmin && !isLoadingPublic && normalizedProducts.length === 0;

  const handleDeleteClick = (productId: string, name: string) => {
    setProductToDelete(productId);
    setProductName(name);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    try {
      await deleteProduct.mutateAsync(productToDelete);
      toast.success("Xóa sản phẩm thành công");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      setProductName("");
    } catch (error: any) {
      console.error("Delete product error:", error);
      const errorMessage = error?.message || error?.data?.message || "Không thể xóa sản phẩm. Vui lòng đảm bảo bạn đã đăng nhập bằng tài khoản admin.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">
            Quản lý sản phẩm
          </p>
          <h1 className="text-3xl font-bold text-emerald-950">Sản phẩm</h1>
          <p className="text-sm text-emerald-900/80">
            Danh sách toàn bộ sản phẩm đang kinh doanh trên PickleBall Shop.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/products">
            <Button variant="outline">Xem trên cửa hàng</Button>
          </Link>
          <Link href="/admin/products/new">
            <Button className="bg-emerald-500 text-white hover:bg-emerald-400">
              <PackagePlus className="mr-2 h-4 w-4" />
              Thêm sản phẩm
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-emerald-100 bg-white/95 shadow-[0_20px_60px_rgba(15,118,110,0.1)]">
        <CardHeader>
          <CardTitle>Tất cả sản phẩm</CardTitle>
            <CardDescription>
              Theo dõi giá, tồn kho và thông tin sản phẩm.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {showError ? (
              <div className="py-12 text-center text-destructive">
                Không thể tải dữ liệu sản phẩm. Vui lòng kiểm tra quyền truy cập hoặc thử lại.
              </div>
            ) : (isLoadingAdmin || isLoadingPublic) && normalizedProducts.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              Đang tải sản phẩm...
            </div>
          ) : normalizedProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Hình ảnh</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Giá bán</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Thương hiệu</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {normalizedProducts.map((product) => {
                    const stock =
                      "stockQuantity" in product
                        ? product.stockQuantity ?? "N/A"
                        : "N/A";
                    
                    // Get image URL - handle both ProductListDto (has primaryImageUrl) and ProductDto (has imageUrls)
                    // Helper to validate URL
                    const isValidUrl = (url: string | null | undefined): boolean => {
                      if (!url || typeof url !== 'string' || url.trim() === '') {
                        return false;
                      }
                      try {
                        if (url.startsWith('/')) {
                          return true; // Relative path is valid
                        }
                        if (url.startsWith('http://') || url.startsWith('https://')) {
                          new URL(url);
                          return true;
                        }
                        return false;
                      } catch {
                        return false;
                      }
                    };
                    
                    // Get image URL with validation - same as ProductCard
                    let imageUrl: string | null = null;
                    
                    // Check if product has primaryImageUrl (ProductListDto)
                    if ("primaryImageUrl" in product && product.primaryImageUrl) {
                      if (isValidUrl(product.primaryImageUrl)) {
                        imageUrl = product.primaryImageUrl;
                      }
                    }
                    
                    // If no primaryImageUrl, check imageUrls (ProductDto)
                    if (!imageUrl && "imageUrls" in product && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
                      const firstImage = product.imageUrls[0];
                      if (isValidUrl(firstImage)) {
                        imageUrl = firstImage;
                      }
                    }

                    // Check if URL is Cloudinary URL
                    const isCloudinaryUrl = imageUrl && (
                      imageUrl.includes('res.cloudinary.com') || 
                      imageUrl.includes('cloudinary.com')
                    );

                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          {imageUrl ? (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-emerald-100 bg-emerald-50">
                              {isCloudinaryUrl ? (
                                // Use regular img tag for Cloudinary URLs to avoid Next.js Image optimization issues
                                <img
                                  src={imageUrl}
                                  alt={product.name || "Product image"}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    // Fallback to placeholder on error
                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23e5e7eb'/%3E%3C/svg%3E";
                                  }}
                                />
                              ) : (
                                // Use Next.js Image for other URLs
                                <Image
                                  src={imageUrl}
                                  alt={product.name || "Product image"}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                  unoptimized={imageUrl.startsWith('http')}
                                  onError={(e) => {
                                    // Hide image on error, will show placeholder
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {product.name}
                        </TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>{stock}</TableCell>
                        <TableCell>{product.brand ?? "—"}</TableCell>
                        <TableCell>
                        <div className="flex justify-end gap-2">
                            <Link
                              href={`/products/${product.id}`}
                              target="_blank"
                            >
                              <Button size="icon" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            {isAdmin && (
                            <Link
                              href={`/admin/products/${product.id}`}
                              className="inline-flex"
                            >
                              <Button size="icon" variant="secondary">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                            {isAdmin && (
                              <Button
                                size="icon"
                                variant="destructive"
                                onClick={() => handleDeleteClick(product.id, product.name || "sản phẩm này")}
                                disabled={deleteProduct.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              Không tìm thấy sản phẩm nào.
              {isAdminErrorQuery && !isAdmin && (
                <p className="text-sm mt-2">
                  (Bạn cần đăng nhập bằng tài khoản admin để xem dữ liệu đầy đủ.)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa sản phẩm"
        description={`Bạn có chắc chắn muốn xóa sản phẩm "${productName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa sản phẩm"
        isLoading={deleteProduct.isPending}
      />
    </div>
  );
}

