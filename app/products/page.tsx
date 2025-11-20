"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProductGrid } from "@/components/shared/ProductGrid";
import { ProductGridSkeleton } from "@/components/shared/ProductSkeleton";
import { useProducts, useCategories } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import ProductsLoading from "./loading";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState<string | undefined>(
    searchParams.get("categoryId") || undefined
  );
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const { data, isLoading } = useProducts({
    Page: page,
    PageSize: 12,
    CategoryId: categoryId,
    SearchTerm: searchTerm || undefined,
    MinPrice: minPrice ? parseFloat(minPrice) : undefined,
    MaxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
  });

  const { data: categories } = useCategories();

  // Reset về trang 1 khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [categoryId, searchTerm, minPrice, maxPrice]);

  const handleSearch = () => {
    setPage(1);
  };

  // Tính toán số trang hiển thị
  const getPageNumbers = () => {
    if (!data || !data.totalPages) return [];
    const totalPages = data.totalPages;
    const currentPage = data.page || 1;
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      // Chỉ có 1 trang
      pages.push(1);
    } else if (totalPages <= 7) {
      // Nếu ít hơn 7 trang, hiển thị tất cả
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Luôn hiển thị trang đầu
      pages.push(1);

      if (currentPage <= 3) {
        // Gần đầu
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Gần cuối
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Ở giữa
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Debug: Log pagination data
  if (data && process.env.NODE_ENV === "development") {
    console.log("Pagination data:", {
      page: data.page,
      totalPages: data.totalPages,
      totalCount: data.totalCount,
      itemsLength: data.items?.length,
      hasNextPage: data.hasNextPage,
      hasPreviousPage: data.hasPreviousPage,
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-emerald-950">Sản phẩm</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <div className="space-y-4 border border-emerald-100 rounded-lg p-4 bg-white/95 shadow-sm">
            <h2 className="font-semibold text-lg text-emerald-950">Bộ lọc</h2>

            <div>
              <Label htmlFor="search">Tìm kiếm</Label>
              <Input
                id="search"
                placeholder="Tìm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div>
              <Label htmlFor="category">Danh mục</Label>
              <Select
                id="category"
                value={categoryId || "all"}
                onValueChange={(value) =>
                  setCategoryId(value === "all" ? undefined : value)
                }
              >
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div>
              <Label htmlFor="minPrice">Giá tối thiểu (₫)</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>

            <div>
              <Label htmlFor="maxPrice">Giá tối đa (₫)</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="1000000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="border-emerald-200 focus:border-emerald-400"
              />
            </div>

            <Button 
              onClick={handleSearch} 
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              Áp dụng bộ lọc
            </Button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <ProductGridSkeleton count={12} />
          ) : data?.items && data.items.length > 0 ? (
            <>
              <div className="mb-6 flex items-center justify-between">
                <p className="text-sm text-emerald-900/80">
                  Hiển thị <span className="font-semibold text-emerald-700">{data.items.length}</span> trong tổng số{" "}
                  <span className="font-semibold text-emerald-700">{data.totalCount}</span> sản phẩm
                  {data.totalPages > 0 && (
                    <span className="ml-2">
                      (Trang {data.page}/{data.totalPages})
                    </span>
                  )}
                </p>
              </div>
              <ProductGrid products={data.items} />
              
              {/* Pagination - Luôn hiển thị nếu có data */}
              {data && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  {/* Tính toán totalPages nếu API không trả về */}
                  {(() => {
                    const totalPages = data.totalPages || Math.ceil((data.totalCount || 0) / (data.pageSize || 12));
                    const currentPage = data.page || 1;
                    const hasNext = data.hasNextPage ?? (currentPage < totalPages);
                    const hasPrev = data.hasPreviousPage ?? (currentPage > 1);

                    if (totalPages <= 0) return null;

                    return (
                      <>
                        <div className="flex items-center gap-1 flex-wrap justify-center">
                          {/* First page button */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(1)}
                            disabled={!hasPrev || currentPage === 1}
                            className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50"
                            title="Trang đầu"
                          >
                            <ChevronsLeft className="h-4 w-4" />
                          </Button>
                          
                          {/* Previous page button */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={!hasPrev}
                            className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50"
                            title="Trang trước"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          {/* Page numbers */}
                          <div className="flex items-center gap-1 flex-wrap justify-center">
                            {getPageNumbers().map((pageNum, index) => {
                              if (pageNum === "...") {
                                return (
                                  <span
                                    key={`ellipsis-${index}`}
                                    className="px-2 text-emerald-600"
                                  >
                                    ...
                                  </span>
                                );
                              }
                              const pageNumber = pageNum as number;
                              const isActive = pageNumber === currentPage;
                              return (
                                <Button
                                  key={pageNumber}
                                  variant={isActive ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setPage(pageNumber)}
                                  className={
                                    isActive
                                      ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 min-w-[40px]"
                                      : "border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-900 min-w-[40px]"
                                  }
                                >
                                  {pageNumber}
                                </Button>
                              );
                            })}
                          </div>

                          {/* Next page button */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={!hasNext}
                            className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50"
                            title="Trang sau"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>

                          {/* Last page button */}
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPage(totalPages)}
                            disabled={!hasNext || currentPage === totalPages}
                            className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50"
                            title="Trang cuối"
                          >
                            <ChevronsRight className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <p className="text-xs text-emerald-900/60">
                          {data.pageSize || 12} sản phẩm mỗi trang
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Không tìm thấy sản phẩm nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

