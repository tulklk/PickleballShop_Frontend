"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ProductDto, ProductVariantDto } from "@/lib/api/types";
import { Package, CheckCircle, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils/formatCurrency";

interface VariantSelectorProps {
  product: ProductDto;
  selectedVariant: ProductVariantDto | null;
  onVariantSelect: (variant: ProductVariantDto | null) => void;
}

export function VariantSelector({
  product,
  selectedVariant,
  onVariantSelect,
}: VariantSelectorProps) {
  const variants = product.variants || [];

  // Extract unique values
  const colors = useMemo(() => {
    const colorSet = new Set<string>();
    variants.forEach((v) => {
      if (v.color) colorSet.add(v.color);
    });
    return Array.from(colorSet).sort();
  }, [variants]);

  // Check if product is clothing (quần áo)
  const isClothing = useMemo(() => {
    const categoryName = product.categoryName?.toLowerCase() || "";
    const productName = product.name?.toLowerCase() || "";
    return (
      categoryName.includes("quần") ||
      categoryName.includes("áo") ||
      categoryName.includes("clothing") ||
      productName.includes("quần") ||
      productName.includes("áo")
    );
  }, [product.categoryName, product.name]);

  const sizes = useMemo(() => {
    const sizeSet = new Set<string>();
    variants.forEach((v) => {
      if (v.size) sizeSet.add(v.size);
    });
    
    // For clothing, sort S, M, L, XL first, then others
    if (isClothing) {
      const clothingSizes = ["S", "M", "L", "XL", "XXL", "XXXL"];
      const otherSizes: string[] = [];
      
      Array.from(sizeSet).forEach((size) => {
        const upperSize = size.toUpperCase().trim();
        if (!clothingSizes.includes(upperSize)) {
          otherSizes.push(size);
        }
      });
      
      return [
        ...clothingSizes.filter((s) => sizeSet.has(s)),
        ...otherSizes.sort((a, b) => {
          const aNum = parseInt(a);
          const bNum = parseInt(b);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum - bNum;
          }
          return a.localeCompare(b);
        }),
      ];
    }
    
    // For non-clothing, sort numerically if possible
    return Array.from(sizeSet).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
      return a.localeCompare(b);
    });
  }, [variants, isClothing]);

  const specs = useMemo(() => {
    const specSet = new Set<string>();
    variants.forEach((v) => {
      if (v.spec) specSet.add(v.spec);
    });
    return Array.from(specSet).sort();
  }, [variants]);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedSpec, setSelectedSpec] = useState<string | null>(null);

  // Initialize selections when product/variants load
  useEffect(() => {
    if (variants.length === 0) return;

    // Nếu đã có selectedVariant từ ngoài truyền vào thì sync lại state local
    if (selectedVariant) {
      const variantExists = variants.find((v) => v.id === selectedVariant.id);
      if (variantExists) {
        setSelectedColor(selectedVariant.color || null);
        setSelectedSize(selectedVariant.size || null);
        setSelectedSpec(selectedVariant.spec || null);
        return;
      }
    }

    // Mặc định: không tự chọn biến thể nào, để user tự chọn
    setSelectedColor(null);
    setSelectedSize(null);
    setSelectedSpec(null);
    onVariantSelect(null);
  }, [product.id, variants, selectedVariant?.id, onVariantSelect]); // Run when product or variants change

  // Sync state when selectedVariant changes externally (from parent)
  useEffect(() => {
    if (selectedVariant) {
      setSelectedColor(selectedVariant.color || null);
      setSelectedSize(selectedVariant.size || null);
      setSelectedSpec(selectedVariant.spec || null);
    }
  }, [selectedVariant?.id]); // Only when variant ID changes

  // Find matching variant when selections change
  useEffect(() => {
    if (variants.length === 0) return;

    // Nếu không chọn màu, size, spec nào (sau khi bấm Xóa) thì không auto-chọn lại
    if (!selectedColor && !selectedSize && !selectedSpec) {
      return;
    }

    // Find variant that matches all currently selected attributes
    const matchingVariant = variants.find((v) => {
      if (!v.isActive) return false;
      
      // Match selected attributes exactly
      // If an attribute is selected, the variant must have that exact value
      // If an attribute is not selected (null), we don't filter by it
      const colorMatch = !selectedColor || v.color === selectedColor;
      const sizeMatch = !selectedSize || v.size === selectedSize;
      const specMatch = !selectedSpec || v.spec === selectedSpec;
      
      return colorMatch && sizeMatch && specMatch;
    });

    if (matchingVariant && matchingVariant.id !== selectedVariant?.id) {
      onVariantSelect(matchingVariant);
    }
  }, [selectedColor, selectedSize, selectedSpec, variants, selectedVariant, onVariantSelect]);

  // Check if a variant option is available with current selections
  const isOptionAvailable = (
    value: string | null,
    type: "color" | "size" | "spec"
  ): boolean => {
    if (!value) return false;

    return variants.some((v) => {
      const colorMatch =
        type === "color"
          ? v.color === value
          : !selectedColor || v.color === selectedColor;
      const sizeMatch =
        type === "size"
          ? v.size === value
          : !selectedSize || v.size === selectedSize;
      const specMatch =
        type === "spec"
          ? v.spec === value
          : !selectedSpec || v.spec === selectedSpec;

      return colorMatch && sizeMatch && specMatch && v.isActive;
    });
  };

  // Get available variants for a specific option
  const getAvailableVariants = (
    value: string | null,
    type: "color" | "size" | "spec"
  ): ProductVariantDto[] => {
    if (!value) return [];

    return variants.filter((v) => {
      const matchesValue =
        type === "color"
          ? v.color === value
          : type === "size"
          ? v.size === value
          : v.spec === value;

      const colorMatch = type === "color" || !selectedColor || v.color === selectedColor;
      const sizeMatch = type === "size" || !selectedSize || v.size === selectedSize;
      const specMatch = type === "spec" || !selectedSpec || v.spec === selectedSpec;

      return matchesValue && colorMatch && sizeMatch && specMatch && v.isActive;
    });
  };

  const isOutOfStock = (value: string | null, type: "color" | "size" | "spec"): boolean => {
    const availableVariants = getAvailableVariants(value, type);
    return availableVariants.length === 0 || availableVariants.every((v) => v.stockQuantity === 0);
  };

  return (
    <div className="space-y-4">
      {/* Color Selection */}
      {colors.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900">Màu sắc:</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => {
              const available = isOptionAvailable(color, "color");
              const outOfStock = isOutOfStock(color, "color");
              return (
                <Button
                  key={color}
                  type="button"
                  variant={selectedColor === color ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedColor(color);
                  }}
                  disabled={!available || outOfStock}
                  className={`min-w-[80px] ${
                    selectedColor === color
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : ""
                  } ${outOfStock ? "opacity-60 cursor-not-allowed bg-gray-100 text-gray-400 line-through" : ""}`}
                >
                  {color}
                  {outOfStock && " (Hết)"}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900">Size:</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const available = isOptionAvailable(size, "size");
              const outOfStock = isOutOfStock(size, "size");
              const isSelected = selectedSize === size;
              
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    if (outOfStock) return;
                    setSelectedSize(size);
                  }}
                  disabled={outOfStock}
                  className={`
                    relative min-w-[50px] h-10 px-4 rounded-md
                    border-2 transition-all
                    ${isSelected && !outOfStock
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-semibold"
                      : "border-gray-300 bg-white text-gray-700 hover:border-emerald-400"
                    }
                    ${outOfStock 
                      ? "opacity-60 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400 line-through" 
                      : "cursor-pointer"
                    }
                  `}
                  style={outOfStock ? {
                    backgroundImage: `repeating-linear-gradient(
                      135deg,
                      rgba(0,0,0,0.06),
                      rgba(0,0,0,0.06) 4px,
                      transparent 4px,
                      transparent 8px
                    )`
                  } : {}}
                >
                  {size}
                </button>
              );
            })}
          </div>

          {/* Đã ẩn status "Còn hàng (x sản phẩm)" và nút "Xóa" cho size theo yêu cầu */}
        </div>
      )}

      {/* Spec Selection */}
      {specs.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-900">Thông số:</label>
          <div className="flex flex-wrap gap-2">
            {specs.map((spec) => {
              const available = isOptionAvailable(spec, "spec");
              const outOfStock = isOutOfStock(spec, "spec");
              return (
                <Button
                  key={spec}
                  type="button"
                  variant={selectedSpec === spec ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSelectedSpec(spec);
                  }}
                  disabled={!available || outOfStock}
                  className={`min-w-[80px] ${
                    selectedSpec === spec
                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                      : ""
                  } ${outOfStock ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {spec && /mm$/i.test(spec) ? spec : `${spec}mm`}
                  {outOfStock && " (Hết)"}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Variant Info */}
      {/* Đã ẩn khung "Đã chọn: ..." và "Tồn kho: ... sản phẩm" theo yêu cầu */}
    </div>
  );
}

