"use client";

import { Select, SelectItem } from "@/components/ui/select";
import { ArrowDownWideNarrow } from "lucide-react";

interface ProductSortingProps {
  value: string;
  onChange: (value: string) => void;
}

export function ProductSorting({ value, onChange }: ProductSortingProps) {
  return (
    <div className="flex items-center gap-2">
      <ArrowDownWideNarrow className="h-4 w-4 text-gray-700" />
      <span className="text-sm text-gray-700">Sắp xếp:</span>
      <Select value={value} onValueChange={onChange} className="w-[180px]">
        <SelectItem value="default">Mặc định</SelectItem>
        <SelectItem value="price-asc">Giá tăng dần</SelectItem>
        <SelectItem value="price-desc">Giá giảm dần</SelectItem>
        <SelectItem value="newest">Hàng mới nhất</SelectItem>
      </Select>
    </div>
  );
}
