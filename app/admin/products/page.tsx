"use client";

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
import { formatDate } from "@/lib/utils/formatDate";
import { toast } from "sonner";
import { PackagePlus, Trash2, Eye, Pencil } from "lucide-react";
import type { Product, ProductListDto } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/useAuth";
import { useState } from "react";

export default function AdminProductsPage() {
  const { isAdmin } = useAuth();
  const [adminError, setAdminError] = useState(false);
  const {
    data: adminProducts,
    isLoading: isLoadingAdmin,
  } = useAdminProducts({
    enabled: isAdmin,
    onError: () => setAdminError(true),
  });
  const { data: publicProducts } = useProducts({ Page: 1, PageSize: 100 });
  const deleteProduct = useAdminDeleteProduct();

  const normalizedProducts = (adminProducts?.length
    ? adminProducts
    : publicProducts?.items ?? []) as Array<Product | ProductListDto>;

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct.mutateAsync(productId);
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error(
        "Failed to delete product. Make sure you are logged in as an admin."
      );
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
              Theo dõi giá, tồn kho và ngày tạo gần nhất.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {adminError ? (
              <div className="py-12 text-center text-destructive">
                Không thể tải dữ liệu admin. Vui lòng kiểm tra quyền truy cập hoặc thử lại.
              </div>
            ) : isLoadingAdmin && !normalizedProducts.length ? (
            <div className="py-12 text-center text-muted-foreground">
              Loading products...
            </div>
          ) : normalizedProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên</TableHead>
                    <TableHead>Giá bán</TableHead>
                    <TableHead>Tồn kho</TableHead>
                    <TableHead>Thương hiệu</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {normalizedProducts.map((product) => {
                    const stock =
                      "stockQuantity" in product
                        ? product.stockQuantity ?? "N/A"
                        : "N/A";
                    const createdAt =
                      "createdAt" in product ? product.createdAt : undefined;

                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-semibold">
                          {product.name}
                        </TableCell>
                        <TableCell>{formatCurrency(product.price)}</TableCell>
                        <TableCell>{stock}</TableCell>
                        <TableCell>{product.brand ?? "—"}</TableCell>
                        <TableCell>
                          {createdAt && typeof createdAt === 'string' ? formatDate(createdAt) : "—"}
                        </TableCell>
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
                                onClick={() => handleDelete(product.id)}
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
              No products found.
              {isAdminError && (
                <p className="text-sm">
                  (Bạn cần đăng nhập bằng tài khoản admin để xem dữ liệu trực
                  tiếp.)
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

