"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { ProductVariantDto } from "@/lib/api/types";

export interface ProductVariantFormData {
  id?: string;
  color?: string | null;
  size?: string | null;
  spec?: string | null;
  price: number;
  originalPrice?: number | null;
  stockQuantity: number;
  sku: string;
  isActive: boolean;
}

interface VariantFormItemProps {
  variant: ProductVariantFormData;
  index: number;
  basePrice: number;
  baseOriginalPrice?: number | null;
  onChange: (field: keyof ProductVariantFormData, value: any) => void;
  onRemove: () => void;
}

export function VariantFormItem({
  variant,
  index,
  basePrice,
  baseOriginalPrice,
  onChange,
  onRemove,
}: VariantFormItemProps) {
  const [variantType, setVariantType] = useState<"color" | "size" | "sizeClothing" | "spec" | "custom">(() => {
    // Auto-detect variant type based on existing data
    if (variant.color) return "color";
    if (variant.size) {
      // Check if size is S, M, L, XL (clothing sizes)
      const sizeUpper = variant.size.toUpperCase().trim();
      if (["S", "M", "L", "XL", "XXL", "XXXL"].includes(sizeUpper)) {
        return "sizeClothing";
      }
      return "size";
    }
    if (variant.spec) return "spec";
    return "color"; // Default
  });

  const hasAtLeastOneAttribute = !!(variant.color || variant.size || variant.spec);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h4 className="font-semibold text-gray-900">Variant #{index + 1}</h4>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Variant Type Selector */}
      <div>
        <Label className="text-sm font-semibold">Loại variant:</Label>
        <select
          value={variantType}
          onChange={(e) => {
            const newType = e.target.value as "color" | "size" | "sizeClothing" | "spec" | "custom";
            setVariantType(newType);
            // Clear other fields when switching type
            if (newType === "color") {
              onChange("size", null);
              onChange("spec", null);
            } else if (newType === "size" || newType === "sizeClothing") {
              onChange("color", null);
              onChange("spec", null);
            } else if (newType === "spec") {
              onChange("color", null);
              onChange("size", null);
            }
          }}
          className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="color">Màu sắc (cho vợt)</option>
          <option value="size">Size (cho giày)</option>
          <option value="sizeClothing">Size (cho quần áo: S, M, L, XL)</option>
          <option value="spec">Thông số (cho vợt: 13mm, 15mm)</option>
          <option value="custom">Tùy chỉnh</option>
        </select>
      </div>

      {/* Dynamic Fields based on variant type */}
      {variantType === "color" && (
        <div>
          <Label className="text-sm font-semibold">
            Màu sắc: <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={variant.color || ""}
            onChange={(e) => onChange("color", e.target.value || null)}
            placeholder="Ví dụ: Đỏ, Xanh, Đen"
            className="mt-1"
          />
        </div>
      )}

      {variantType === "size" && (
        <div>
          <Label className="text-sm font-semibold">
            Size: <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={variant.size || ""}
            onChange={(e) => onChange("size", e.target.value || null)}
            placeholder="Ví dụ: 40, 41, 42, 43"
            className="mt-1"
          />
        </div>
      )}

      {variantType === "sizeClothing" && (
        <div>
          <Label className="text-sm font-semibold">
            Size: <span className="text-red-500">*</span>
          </Label>
          <select
            value={variant.size || ""}
            onChange={(e) => onChange("size", e.target.value || null)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Chọn size</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
            <option value="XXL">XXL</option>
            <option value="XXXL">XXXL</option>
          </select>
        </div>
      )}

      {variantType === "spec" && (
        <div>
          <Label className="text-sm font-semibold">
            Thông số: <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            value={variant.spec || ""}
            onChange={(e) => onChange("spec", e.target.value || null)}
            placeholder="Ví dụ: 13mm, 15mm"
            className="mt-1"
          />
        </div>
      )}

      {variantType === "custom" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-sm">Màu sắc (tùy chọn)</Label>
            <Input
              type="text"
              value={variant.color || ""}
              onChange={(e) => onChange("color", e.target.value || null)}
              placeholder="Màu sắc"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Size (tùy chọn)</Label>
            <Input
              type="text"
              value={variant.size || ""}
              onChange={(e) => onChange("size", e.target.value || null)}
              placeholder="Size"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Thông số (tùy chọn)</Label>
            <Input
              type="text"
              value={variant.spec || ""}
              onChange={(e) => onChange("spec", e.target.value || null)}
              placeholder="Thông số"
              className="mt-1"
            />
          </div>
          {!hasAtLeastOneAttribute && (
            <div className="col-span-3 flex items-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>⚠️ Ít nhất một trường phải được điền</span>
            </div>
          )}
        </div>
      )}

      {/* SKU */}
      <div>
        <Label className="text-sm font-semibold">
          SKU: <span className="text-red-500">*</span>
        </Label>
        <Input
          type="text"
          value={variant.sku}
          onChange={(e) => onChange("sku", e.target.value)}
          placeholder="Ví dụ: PADDLE-001-RED-13MM"
          className="mt-1"
          required
        />
      </div>

      {/* Price Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-semibold">
            Giá: <span className="text-red-500">*</span>
          </Label>
          <Input
            type="number"
            step="0.01"
            value={variant.price || ""}
            onChange={(e) => onChange("price", parseFloat(e.target.value) || 0)}
            placeholder="Giá của variant"
            className="mt-1"
            min="0"
          />
          <p className="text-xs text-gray-500 mt-1">
            Giá gợi ý từ product: {basePrice.toLocaleString("vi-VN")} ₫
          </p>
        </div>
        <div>
          <Label className="text-sm font-semibold">Giá gốc (tùy chọn):</Label>
          <Input
            type="number"
            step="0.01"
            value={variant.originalPrice || ""}
            onChange={(e) =>
              onChange("originalPrice", e.target.value ? parseFloat(e.target.value) : null)
            }
            placeholder="Giá gốc nếu có giảm giá"
            className="mt-1"
            min="0"
          />
        </div>
      </div>

      {/* Stock Quantity */}
      <div>
        <Label className="text-sm font-semibold">
          Số lượng tồn kho: <span className="text-red-500">*</span>
        </Label>
        <Input
          type="number"
          value={variant.stockQuantity || ""}
          onChange={(e) => onChange("stockQuantity", parseInt(e.target.value) || 0)}
          placeholder="0"
          className="mt-1"
          min="0"
          required
        />
      </div>

      {/* Is Active */}
      <div className="flex items-center justify-between pt-2 border-t">
        <Label htmlFor={`variant-${index}-active`} className="text-sm font-semibold">
          Kích hoạt variant
        </Label>
        <Switch
          id={`variant-${index}-active`}
          checked={variant.isActive}
          onCheckedChange={(checked) => onChange("isActive", checked)}
        />
      </div>
    </div>
  );
}

