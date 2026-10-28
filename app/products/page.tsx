"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ProductGrid } from "@/components/shared/ProductGrid";
import { ProductGridSkeleton } from "@/components/shared/ProductSkeleton";
import { useProducts, useAllProducts, useCategories, useCategoryTree } from "@/lib/api/hooks";
import { CategoryFilterSidebar } from "@/components/products/CategoryFilterSidebar";
import { ProductSorting } from "@/components/products/ProductSorting";
import { Button } from "@/components/ui/button";
import ProductsLoading from "./loading";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronRight as ChevronRightIcon, Filter, X } from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";
import type { CategoryTreeDto } from "@/lib/api/types";

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const categoryId = searchParams.get("categoryId") || undefined;
  const searchTerm = searchParams.get("search") || "";
  
  // Filter states
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  // Racket-specific filters
  const [selectedGripCircumference, setSelectedGripCircumference] = useState<string[]>([]);
  const [selectedCoreThickness, setSelectedCoreThickness] = useState<string[]>([]);
  const [selectedSurfaceTexture, setSelectedSurfaceTexture] = useState<string[]>([]);
  const [selectedSurfaceMaterial, setSelectedSurfaceMaterial] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("default");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Calculate min/max price from selected ranges
  const priceFilters = useMemo(() => {
    let minPrice: number | undefined;
    let maxPrice: number | undefined;

    selectedPriceRanges.forEach((range) => {
      switch (range) {
        case "under-500k":
          if (!maxPrice || maxPrice > 500000) maxPrice = 500000;
          break;
        case "500k-1m":
          if (!minPrice || minPrice < 500000) minPrice = 500000;
          if (!maxPrice || maxPrice > 1000000) maxPrice = 1000000;
          break;
        case "1m-2m":
          if (!minPrice || minPrice < 1000000) minPrice = 1000000;
          if (!maxPrice || maxPrice > 2000000) maxPrice = 2000000;
          break;
        case "2m-3m":
          if (!minPrice || minPrice < 2000000) minPrice = 2000000;
          if (!maxPrice || maxPrice > 3000000) maxPrice = 3000000;
          break;
        case "over-3m":
          if (!minPrice || minPrice < 3000000) minPrice = 3000000;
          break;
      }
    });

    return { minPrice, maxPrice };
  }, [selectedPriceRanges]);

  // Fetch products with filters
  const { data, isLoading } = useProducts({
    Page: page,
    PageSize: 12,
    CategoryId: categoryId,
    SearchTerm: searchTerm || undefined,
    MinPrice: priceFilters.minPrice,
    MaxPrice: priceFilters.maxPrice,
    Brand: selectedBrands.length > 0 ? selectedBrands[0] : undefined, // API might only support single brand
  });

  // Fetch all products for brand extraction (with larger page size)
  const { data: allProductsData } = useAllProducts({
    CategoryId: categoryId,
    SearchTerm: searchTerm || undefined,
  });

  const { data: categoryTree } = useCategoryTree();

  // Find category name and children for breadcrumb and display
  const { categoryName, childCategories } = useMemo(() => {
    if (!categoryId || !categoryTree) return { categoryName: null, childCategories: [] };
    
    const findCategory = (cats: CategoryTreeDto[]): CategoryTreeDto | null => {
      for (const cat of cats) {
        if (cat.id === categoryId) {
          return cat;
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };

    const found = findCategory(categoryTree);
    return {
      categoryName: found?.name || null,
      childCategories: found?.children || []
    };
  }, [categoryId, categoryTree]);

  // Filter products by brand and size (client-side)
  const filteredProducts = useMemo(() => {
    if (!data?.items) return [];
    
    let filtered = [...data.items];

    // Filter by brands (if multiple brands selected, show products matching any)
    if (selectedBrands.length > 0) {
      filtered = filtered.filter((product) =>
        product.brand && selectedBrands.includes(product.brand)
      );
    }

    // Note: Size filtering would require product variants data
    // For now, we'll skip size filtering as it needs variant information

    return filtered;
  }, [data?.items, selectedBrands]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const products = filteredProducts;
    switch (sortBy) {
      case "price-asc":
        return [...products].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...products].sort((a, b) => b.price - a.price);
      case "newest":
      case "default":
      default:
        return products; // Keep original order
    }
  }, [filteredProducts, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [categoryId, searchTerm, selectedPriceRanges, selectedBrands, selectedSizes, selectedGripCircumference, selectedCoreThickness, selectedSurfaceTexture, selectedSurfaceMaterial]);

  // Calculate pagination
  const getPageNumbers = () => {
    if (!data || !data.totalPages) return [];
    const totalPages = data.totalPages;
    const currentPage = data.page || 1;
    const pages: (number | string)[] = [];

    if (totalPages <= 1) {
      pages.push(1);
    } else if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage <= 3) {
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
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

  const { ref: sidebarRef, isVisible: sidebarVisible } = useScrollAnimation({ threshold: 0.1 });
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation({ threshold: 0.1 });

  const handleCategoryClick = (newCategoryId: string) => {
    router.push(`/products?categoryId=${newCategoryId}`);
    // Close filter sidebar on mobile after navigation
    setIsFilterOpen(false);
  };

  const showCategoryLayout = !!categoryId;

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Breadcrumb */}
      <nav className="mb-4 text-sm text-gray-600">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/" className="hover:text-emerald-600">
              Trang chủ
            </Link>
          </li>
          {categoryName && (
            <>
              <ChevronRightIcon className="h-4 w-4" />
              <li className="text-emerald-600 font-medium">{categoryName}</li>
            </>
          )}
        </ol>
      </nav>

      {/* Mobile Filter Button - Only show on mobile when categoryId exists */}
      {/* Positioned above ChatBox (bottom-20) with same spacing as ChatBox to Zalo (20px gap) */}
      {/* Order from top to bottom: Filter (bottom-[148px]) > ChatBox (bottom-20) > Zalo (bottom-3) */}
      {/* Spacing: Filter to ChatBox = 148 - 80 - 48 = 20px, ChatBox to Zalo = 80 - 12 - 48 = 20px */}
      {showCategoryLayout && (
        <Button
          onClick={() => setIsFilterOpen(true)}
          className="lg:hidden fixed bottom-[148px] right-3 z-50 h-12 w-12 rounded-full shadow-xl bg-orange-500 hover:bg-orange-600 hover:shadow-2xl hover:scale-105 flex flex-col items-center justify-center gap-1"
          aria-label="Mở bộ lọc"
        >
          <Filter className="h-5 w-5 text-white" />
          <span className="text-[10px] text-white font-medium">Lọc</span>
        </Button>
      )}

      {/* Mobile Overlay - Only show on mobile when filter is open */}
      <div
        className={`lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsFilterOpen(false)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-1 md:gap-2">
        {/* Sidebar - Show CategoryFilterSidebar when categoryId exists, otherwise show simple filters */}
        <aside 
          ref={sidebarRef} 
          className={`
            lg:col-span-1 scroll-animate ${sidebarVisible ? 'visible' : ''}
            lg:block
            fixed lg:relative top-0 right-0 h-full lg:h-auto w-[85vw] max-w-sm lg:max-w-none z-50 lg:z-auto
            bg-white lg:bg-transparent
            transition-transform duration-300 ease-out
            will-change-transform
            ${isFilterOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            overflow-y-auto lg:overflow-visible
            shadow-xl lg:shadow-none
          `}
          style={{ backfaceVisibility: 'hidden' }}
        >
          {/* Close button for mobile - Only show when filter sidebar is open */}
          {showCategoryLayout && (
            <div className="lg:hidden flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="font-semibold text-lg text-emerald-950">Bộ lọc</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFilterOpen(false)}
                className="h-8 w-8"
                aria-label="Đóng bộ lọc"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
          
          <div className="p-4 lg:p-0">
            {showCategoryLayout ? (
              <CategoryFilterSidebar
                categoryId={categoryId}
                categories={categoryTree}
                products={allProductsData?.items || []}
                selectedPriceRanges={selectedPriceRanges}
                selectedBrands={selectedBrands}
                selectedSizes={selectedSizes}
                selectedGripCircumference={selectedGripCircumference}
                selectedCoreThickness={selectedCoreThickness}
                selectedSurfaceTexture={selectedSurfaceTexture}
                selectedSurfaceMaterial={selectedSurfaceMaterial}
                onPriceRangeChange={setSelectedPriceRanges}
                onBrandChange={setSelectedBrands}
                onSizeChange={setSelectedSizes}
                onGripCircumferenceChange={setSelectedGripCircumference}
                onCoreThicknessChange={setSelectedCoreThickness}
                onSurfaceTextureChange={setSelectedSurfaceTexture}
                onSurfaceMaterialChange={setSelectedSurfaceMaterial}
                onCategoryClick={handleCategoryClick}
              />
            ) : (
              <div className="space-y-4 border border-emerald-100 rounded-lg p-3 md:p-4 bg-white/95 shadow-sm">
                <h2 className="font-semibold text-lg text-emerald-950">Bộ lọc</h2>
                <p className="text-sm text-gray-600">
                  Chọn danh mục từ menu để xem bộ lọc chi tiết
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Products Grid */}
        <div ref={contentRef} className={`lg:col-span-3 scroll-animate ${contentVisible ? 'visible' : ''}`}>
          {/* Category Header with Sorting - Only show when categoryId exists, hidden on mobile */}
          {showCategoryLayout && (
            <div className="hidden lg:block mb-6 bg-white border border-gray-200 rounded-lg shadow-sm p-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Category Name - Left side */}
                <div className="text-sm font-semibold text-gray-700 uppercase">
                  {categoryName}
                </div>
                
                {/* Sorting - Right side */}
                <div className="shrink-0">
                  <ProductSorting value={sortBy} onChange={setSortBy} />
                </div>
              </div>
            </div>
          )}
          
          {/* Sorting only on mobile - without category header */}
          {showCategoryLayout && (
            <div className="lg:hidden mb-4 flex justify-end">
              <ProductSorting value={sortBy} onChange={setSortBy} />
            </div>
          )}

          {isLoading ? (
            <ProductGridSkeleton count={12} />
          ) : sortedProducts.length > 0 ? (
            <>
              <ProductGrid products={sortedProducts} />
              
              {/* Pagination */}
              {data && data.totalPages && data.totalPages > 0 && (
                <div className={`mt-8 flex flex-col items-center gap-4 scroll-animate ${contentVisible ? 'visible' : ''}`}>
                  <div className="flex items-center gap-1 flex-wrap justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(1)}
                      disabled={!data.hasPreviousPage || data.page === 1}
                      className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50"
                      title="Trang đầu"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={!data.hasPreviousPage}
                      className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50"
                      title="Trang trước"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

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
                        const isActive = pageNumber === data.page;
                        return (
                          <Button
                            key={pageNumber}
                            variant={isActive ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNumber)}
                            className={
                              isActive
                                ? "bg-primary text-primary-foreground hover:bg-primary/90 border-primary min-w-[40px]"
                                : "border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-900 min-w-[40px]"
                            }
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                      disabled={!data.hasNextPage}
                      className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50"
                      title="Trang sau"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPage(data.totalPages)}
                      disabled={!data.hasNextPage || data.page === data.totalPages}
                      className="border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 disabled:opacity-50"
                      title="Trang cuối"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <p className="text-xs text-emerald-900/60">
                    {data.pageSize || 12} sản phẩm mỗi trang
                  </p>
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
