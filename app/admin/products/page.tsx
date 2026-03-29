"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useQueries } from "@tanstack/react-query";
import {
  useAdminProducts,
  useAdminDeleteProduct,
  useProducts,
  useCategoryTree,
} from "@/lib/api/hooks";
import { apiClient } from "@/lib/api/client";
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
import { getProductUrl } from "@/lib/utils/productUrl";
import { PackagePlus, Trash2, Eye, Pencil, Package, ChevronDown, ChevronRight } from "lucide-react";
import type { Product, ProductListDto, ProductDto, ProductVariantDto } from "@/lib/api/types";
import Image from "next/image";
import { useAuth } from "@/lib/auth/useAuth";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { findRootCategoryName } from "@/lib/utils/categoryUtils";
import type { CategoryTreeDto } from "@/lib/api/types";
import { DEBUG_API } from "@/lib/utils/debugApi";

export default function AdminProductsPage() {
  const { isAdmin } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [productName, setProductName] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());
  const pageSize = 10;

  const toggleExpand = (productId: string) => {
    setExpandedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const {
    data: adminProducts,
    isLoading: isLoadingAdmin,
    isError: isAdminErrorQuery,
  } = useAdminProducts({
    enabled: isAdmin,
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: publicProducts, isLoading: isLoadingPublic } = useProducts(
    { Page: 1, PageSize: 1000 },
    { refetchOnMount: true, staleTime: 0 }
  );
  const { data: categoryTree } = useCategoryTree();
  const deleteProduct = useAdminDeleteProduct();


  // Prefer publicProducts (ProductListDto[]) because it has primaryImageUrl
  // Only use adminProducts if publicProducts is not available
  const normalizedProducts = (Array.isArray(publicProducts?.items) && publicProducts.items.length > 0
    ? publicProducts.items
    : Array.isArray(adminProducts) && adminProducts.length > 0
    ? adminProducts
    : []) as Array<Product | ProductListDto>;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRootCategory, setSelectedRootCategory] = useState<string>("all");

  // Get root categories from category tree
  const rootCategories = useMemo(() => {
    if (!categoryTree || !Array.isArray(categoryTree)) return [];
    return categoryTree.filter((cat) => cat.name && cat.id);
  }, [categoryTree]);

  const filteredProducts = useMemo(() => {
    let filtered = normalizedProducts;

    // Filter by root category first
    if (selectedRootCategory !== "all" && categoryTree) {
      filtered = filtered.filter((product) => {
        const rootCategoryName = findRootCategoryName(
          "categoryId" in product ? product.categoryId : undefined,
          categoryTree
        );
        return rootCategoryName === selectedRootCategory;
      });
    }

    // Then filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((product) => {
        const name = (product.name || "").toLowerCase();
        const brand = ("brand" in product && product.brand ? product.brand : "N/A").toLowerCase();
        const priceValue =
          "price" in product
            ? typeof product.price === "number"
              ? product.price.toString()
              : String(product.price || "")
            : "0";

        return (
          name.includes(term) ||
          brand.includes(term) ||
          priceValue.includes(term)
        );
      });
    }

    return filtered;
  }, [normalizedProducts, searchTerm, selectedRootCategory, categoryTree, rootCategories]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const visibleProductIds = useMemo(() => paginatedProducts.map((p) => p.id), [paginatedProducts]);
  const visibleProductQueries = useQueries({
    queries: visibleProductIds.map((id) => ({
      queryKey: ["product", id] as const,
      queryFn: () => apiClient.getProductById(id),
      enabled: true,
    })),
  });
  const productDetailsMap = useMemo(() => {
    const map: Record<string, ProductDto> = {};
    visibleProductQueries.forEach((q, i) => {
      const id = visibleProductIds[i];
      if (id && q.data) map[id] = q.data as ProductDto;
    });
    return map;
  }, [visibleProductQueries, visibleProductIds]);

  // Reset to page 1 when search term or root category filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedRootCategory]);

  // Ensure currentPage doesn't exceed totalPages when filtered results change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);
  
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
      if (DEBUG_API) {
        console.error("Delete product error:", error);
      }
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
          <div className="mt-4 flex flex-row gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] md:w-80">
              <Label
                htmlFor="product-search"
                className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500"
              >
                Tìm kiếm sản phẩm
              </Label>
              <Input
                id="product-search"
                placeholder="Tìm theo tên, giá bán hoặc thương hiệu..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to page 1 when searching
                }}
                className="mt-1"
              />
            </div>
            <div className="flex-1 min-w-[200px] md:w-80">
              <Label
                htmlFor="root-category-filter"
                className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500"
              >
                Lọc theo danh mục gốc
              </Label>
              <Select
                id="root-category-filter"
                value={selectedRootCategory}
                onValueChange={(value) => {
                  setSelectedRootCategory(value);
                  setCurrentPage(1);
                }}
                className="mt-1"
              >
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {rootCategories.map((category) => (
                  <SelectItem key={category.id} value={category.name || ""}>
                    {category.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>
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
          ) : filteredProducts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10"></TableHead>
                      <TableHead className="w-20">Hình ảnh</TableHead>
                      <TableHead>Tên</TableHead>
                      <TableHead>Giá bán</TableHead>
                      <TableHead>Tồn kho</TableHead>
                      <TableHead>Thương hiệu</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedProducts.map((product) => {
                    // Safe stock display: coerce to number, avoid NaN/undefined
                    const rawStock = "stockQuantity" in product ? product.stockQuantity : undefined;
                    const stock =
                      rawStock !== undefined && rawStock !== null && !Number.isNaN(Number(rawStock))
                        ? Math.max(0, Math.floor(Number(rawStock)))
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

                    const productDetail = productDetailsMap[product.id];
                    const variants = productDetail?.hasVariants && Array.isArray(productDetail.variants) ? productDetail.variants : [];
                    const hasVariants = variants.length > 0;
                    const isExpanded = expandedProductIds.has(product.id);
                    const isLoadingDetail = isExpanded && productDetail === undefined && visibleProductIds.includes(product.id);

                    const getVariantDisplayName = (v: ProductVariantDto) =>
                      v.displayName ?? ([v.color, v.size, v.spec].filter(Boolean).join(" / ") || "Variant");

                    return (
                      <>
                      <TableRow key={product.id}>
                        <TableCell className="w-10">
                          {hasVariants ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(product.id)}
                              className="flex items-center justify-center w-8 h-8 hover:bg-gray-200 rounded transition-colors"
                              title={isExpanded ? "Thu gọn" : "Mở rộng xem variants"}
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-gray-600" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                          ) : (
                            <span className="w-8 inline-block" />
                          )}
                        </TableCell>
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
                              href={getProductUrl(product)}
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
                      {isExpanded && (
                        <>
                          {isLoadingDetail && (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center text-muted-foreground py-4">
                                Đang tải variants...
                              </TableCell>
                            </TableRow>
                          )}
                          {!isLoadingDetail && hasVariants && variants.map((variant) => (
                            <TableRow key={variant.id} className="bg-gray-50/50">
                              <TableCell className="w-10"></TableCell>
                              <TableCell></TableCell>
                              <TableCell className="pl-8 text-sm text-gray-700">
                                <span className="text-gray-400">↳</span> {getVariantDisplayName(variant)}
                              </TableCell>
                              <TableCell>{formatCurrency(variant.price)}</TableCell>
                              <TableCell>{variant.stockQuantity ?? "—"}</TableCell>
                              <TableCell>—</TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Link href={`/admin/products/${product.id}`}>
                                    <Button size="icon" variant="outline" title="Chỉnh sửa sản phẩm">
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                          {!isLoadingDetail && !hasVariants && (
                            <TableRow>
                              <TableCell colSpan={7} className="pl-12 text-sm text-muted-foreground py-2 bg-gray-50/50">
                                Không có variant.
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      )}
                    </>
                    );
                    })}
                  </TableBody>
                </Table>
              </div>
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
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

