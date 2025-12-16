"use client";

import { useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import type { CategoryTreeDto, ProductListDto } from "@/lib/api/types";

interface CategoryFilterSidebarProps {
  categoryId?: string;
  categories?: CategoryTreeDto[];
  products?: ProductListDto[];
  selectedPriceRanges: string[];
  selectedBrands: string[];
  selectedSizes: string[];
  // New filters for racket category
  selectedGripCircumference?: string[];
  selectedCoreThickness?: string[];
  selectedSurfaceTexture?: string[];
  selectedSurfaceMaterial?: string[];
  onPriceRangeChange: (ranges: string[]) => void;
  onBrandChange: (brands: string[]) => void;
  onSizeChange: (sizes: string[]) => void;
  onGripCircumferenceChange?: (values: string[]) => void;
  onCoreThicknessChange?: (values: string[]) => void;
  onSurfaceTextureChange?: (values: string[]) => void;
  onSurfaceMaterialChange?: (values: string[]) => void;
  onCategoryClick: (categoryId: string) => void;
}

const priceRanges = [
  { value: "under-500k", label: "Giá dưới 500.000₫" },
  { value: "500k-1m", label: "500.000₫ - 1 triệu" },
  { value: "1m-2m", label: "1 - 2 triệu" },
  { value: "2m-3m", label: "2 - 3 triệu" },
  { value: "over-3m", label: "Giá trên 3 triệu" },
];

const sizes = [
  "30", "31", "32", "33", "34", "35", "36", "37", "37.5",
  "38", "38.5", "39", "39.5", "40", "40.5", "41", "41.5",
  "42", "42.5", "43", "43.5", "44", "44.5", "45", "46"
];

// Racket-specific filters
const gripCircumferenceOptions = [
  { value: "standard", label: "Tiêu chuẩn (4-4.25 inch)" },
  { value: "extended", label: "Mở rộng (4.25-4.5 inch)" },
];

const coreThicknessOptions = [
  { value: "thin", label: "Mỏng (12-14 mm)" },
  { value: "medium", label: "Trung bình (14-16 mm)" },
  { value: "thick", label: "Dày (16 mm trở lên)" },
];

const surfaceTextureOptions = [
  { value: "smooth", label: "Mịn (Smooth)" },
  { value: "rough", label: "Nhám (Rough)" },
];

const surfaceMaterialOptions = [
  { value: "fiberglass", label: "Sợi thủy tinh (Fiberglass)" },
  { value: "carbon", label: "Sợi carbon (Carbon Fiber)" },
];

export function CategoryFilterSidebar({
  categoryId,
  categories,
  products = [],
  selectedPriceRanges,
  selectedBrands,
  selectedSizes,
  selectedGripCircumference = [],
  selectedCoreThickness = [],
  selectedSurfaceTexture = [],
  selectedSurfaceMaterial = [],
  onPriceRangeChange,
  onBrandChange,
  onSizeChange,
  onGripCircumferenceChange,
  onCoreThicknessChange,
  onSurfaceTextureChange,
  onSurfaceMaterialChange,
  onCategoryClick,
}: CategoryFilterSidebarProps) {

  // Extract unique brands from products
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((product) => {
      if (product.brand && product.brand.trim()) {
        brands.add(product.brand.trim());
      }
    });
    return Array.from(brands).sort();
  }, [products]);

  // Find current category name and its siblings (children categories)
  const { currentCategory, currentCategoryChildren } = useMemo(() => {
    if (!categories || !categoryId) return { currentCategory: null, currentCategoryChildren: [] };
    
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

    const findParent = (cats: CategoryTreeDto[]): CategoryTreeDto | null => {
      for (const cat of cats) {
        if (cat.children?.some((child) => child.id === categoryId)) {
          return cat;
        }
        if (cat.children && cat.children.length > 0) {
          const found = findParent(cat.children);
          if (found) return found;
        }
      }
      return null;
    };

    // Find current category
    const current = findCategory(categories);
    
    // If current category has children, show them
    if (current?.children && current.children.length > 0) {
      return { currentCategory: current, currentCategoryChildren: current.children };
    }

    // Otherwise, show siblings (other children of parent)
    const parent = findParent(categories);
    if (parent?.children) {
      return { currentCategory: current, currentCategoryChildren: parent.children };
    }

    return { currentCategory: current, currentCategoryChildren: [] };
  }, [categories, categoryId]);

  // Check if this is a racket category
  const isRacketCategory = useMemo(() => {
    if (!currentCategory?.name) return false;
    const name = currentCategory.name.toLowerCase();
    return name.includes("vợt") || name.includes("racket") || name.includes("paddle");
  }, [currentCategory]);

  const handlePriceRangeToggle = (range: string) => {
    if (selectedPriceRanges.includes(range)) {
      onPriceRangeChange(selectedPriceRanges.filter((r) => r !== range));
    } else {
      onPriceRangeChange([...selectedPriceRanges, range]);
    }
  };

  const handleBrandToggle = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      onBrandChange(selectedBrands.filter((b) => b !== brand));
    } else {
      onBrandChange([...selectedBrands, brand]);
    }
  };

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      onSizeChange(selectedSizes.filter((s) => s !== size));
    } else {
      onSizeChange([...selectedSizes, size]);
    }
  };

  const handleGripCircumferenceToggle = (value: string) => {
    if (!onGripCircumferenceChange) return;
    if (selectedGripCircumference.includes(value)) {
      onGripCircumferenceChange(selectedGripCircumference.filter((v) => v !== value));
    } else {
      onGripCircumferenceChange([...selectedGripCircumference, value]);
    }
  };

  const handleCoreThicknessToggle = (value: string) => {
    if (!onCoreThicknessChange) return;
    if (selectedCoreThickness.includes(value)) {
      onCoreThicknessChange(selectedCoreThickness.filter((v) => v !== value));
    } else {
      onCoreThicknessChange([...selectedCoreThickness, value]);
    }
  };

  const handleSurfaceTextureToggle = (value: string) => {
    if (!onSurfaceTextureChange) return;
    if (selectedSurfaceTexture.includes(value)) {
      onSurfaceTextureChange(selectedSurfaceTexture.filter((v) => v !== value));
    } else {
      onSurfaceTextureChange([...selectedSurfaceTexture, value]);
    }
  };

  const handleSurfaceMaterialToggle = (value: string) => {
    if (!onSurfaceMaterialChange) return;
    if (selectedSurfaceMaterial.includes(value)) {
      onSurfaceMaterialChange(selectedSurfaceMaterial.filter((v) => v !== value));
    } else {
      onSurfaceMaterialChange([...selectedSurfaceMaterial, value]);
    }
  };

  return (
    <aside className="w-full lg:w-64 space-y-6">
      {/* Filter Box - Contains Price, Brand, Branch, and Size filters */}
      <div className="border border-gray-200 rounded-lg bg-white p-4 space-y-6">
        {/* Price Range Filter */}
        <div>
          <h3 className="font-semibold text-sm uppercase mb-3 text-gray-900">
            CHỌN MỨC GIÁ
          </h3>
          <div className="space-y-2">
            {priceRanges.map((range) => (
              <div key={range.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`price-${range.value}`}
                  checked={selectedPriceRanges.includes(range.value)}
                  onCheckedChange={() => handlePriceRangeToggle(range.value)}
                />
                <Label
                  htmlFor={`price-${range.value}`}
                  className="text-sm text-gray-700 cursor-pointer font-normal"
                >
                  {range.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Brand Filter */}
        {availableBrands.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-sm uppercase mb-3 text-gray-900">
              THƯƠNG HIỆU
            </h3>
            <div className="space-y-2">
              {availableBrands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={() => handleBrandToggle(brand)}
                  />
                  <Label
                    htmlFor={`brand-${brand}`}
                    className="text-sm text-gray-700 cursor-pointer font-normal"
                  >
                    {brand}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Size Filter - Only show for non-racket categories */}
        {!isRacketCategory && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-sm uppercase mb-3 text-gray-900">
              LỌC THEO SIZE
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {sizes.map((size) => (
                <div key={size} className="flex items-center space-x-2">
                  <Checkbox
                    id={`size-${size}`}
                    checked={selectedSizes.includes(size)}
                    onCheckedChange={() => handleSizeToggle(size)}
                  />
                  <Label
                    htmlFor={`size-${size}`}
                    className="text-sm text-gray-700 cursor-pointer font-normal"
                  >
                    {size}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Racket-specific filters - Only show for racket categories */}
        {isRacketCategory && (
          <>
            {/* Grip Circumference Filter */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-sm uppercase mb-3 text-gray-900">
                CHU VI TAY CẦM
              </h3>
              <div className="space-y-2">
                {gripCircumferenceOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grip-${option.value}`}
                      checked={selectedGripCircumference.includes(option.value)}
                      onCheckedChange={() => handleGripCircumferenceToggle(option.value)}
                    />
                    <Label
                      htmlFor={`grip-${option.value}`}
                      className="text-sm text-gray-700 cursor-pointer font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Core Thickness Filter */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-sm uppercase mb-3 text-gray-900">
                ĐỘ DÀY LÕI
              </h3>
              <div className="space-y-2">
                {coreThicknessOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`core-${option.value}`}
                      checked={selectedCoreThickness.includes(option.value)}
                      onCheckedChange={() => handleCoreThicknessToggle(option.value)}
                    />
                    <Label
                      htmlFor={`core-${option.value}`}
                      className="text-sm text-gray-700 cursor-pointer font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Surface Texture Filter */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-sm uppercase mb-3 text-gray-900">
                CẤU TRÚC BỀ MẶT
              </h3>
              <div className="space-y-2">
                {surfaceTextureOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`texture-${option.value}`}
                      checked={selectedSurfaceTexture.includes(option.value)}
                      onCheckedChange={() => handleSurfaceTextureToggle(option.value)}
                    />
                    <Label
                      htmlFor={`texture-${option.value}`}
                      className="text-sm text-gray-700 cursor-pointer font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Surface Material Filter */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-semibold text-sm uppercase mb-3 text-gray-900">
                CHẤT LIỆU BỀ MẶT
              </h3>
              <div className="space-y-2">
                {surfaceMaterialOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`material-${option.value}`}
                      checked={selectedSurfaceMaterial.includes(option.value)}
                      onCheckedChange={() => handleSurfaceMaterialToggle(option.value)}
                    />
                    <Label
                      htmlFor={`material-${option.value}`}
                      className="text-sm text-gray-700 cursor-pointer font-normal"
                    >
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Category List - Separate box */}
      {currentCategoryChildren.length > 0 && (
        <div className="border border-gray-200 rounded-lg bg-white p-4">
          <h3 className="font-semibold text-sm uppercase mb-3 text-gray-900">
            DANH MỤC SẢN PHẨM
          </h3>
          <div className="space-y-1">
            {currentCategoryChildren.map((child) => (
              <Link
                key={child.id}
                href={`/products?categoryId=${child.id}`}
                onClick={() => onCategoryClick(child.id || "")}
                className={`block text-sm py-2 px-2 rounded transition-colors ${
                  child.id === categoryId
                    ? "text-emerald-600 font-semibold bg-emerald-50"
                    : "text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                }`}
              >
                {child.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
