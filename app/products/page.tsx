"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ProductGrid } from "@/components/shared/ProductGrid";
import { useProducts, useCategories } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProductsPage() {
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

  const handleSearch = () => {
    setPage(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <div className="space-y-4 border rounded-lg p-4">
            <h2 className="font-semibold text-lg">Filters</h2>

            <div>
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={categoryId || "all"}
                onValueChange={(value) =>
                  setCategoryId(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="minPrice">Min Price</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder="0"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="maxPrice">Max Price</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder="1000000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>

            <Button onClick={handleSearch} className="w-full">
              Apply Filters
            </Button>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="text-center py-12">Loading products...</div>
          ) : data?.items && data.items.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {data.items.length} of {data.totalCount} products
              </div>
              <ProductGrid products={data.items} />
              
              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!data.hasPreviousPage}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4">
                    Page {data.page} of {data.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No products found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

