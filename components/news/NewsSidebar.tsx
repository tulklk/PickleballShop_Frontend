"use client";

import Link from "next/link";
import { useNewsCategories } from "@/lib/api/hooks";
import {
  FileText,
  Star,
  Package,
  Racket,
  Circle,
  Shoe,
  ShoppingBag,
  Shirt,
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  "Tin tức": FileText,
  "Kiến thức": FileText,
  "Đánh giá sản phẩm": FileText,
  "Kỹ thuật Pickleball": FileText,
  "Mẹo TIPS Pickleball": FileText,
  "Luật chơi Pickleball": FileText,
  "Khuyến mãi": FileText,
  "Chỉ có trong hôm nay": Star,
  "Có gì mới": Package,
  "Vợt Pickleball": Racket,
  "Bóng Pickleball": Circle,
  "Giày Pickleball": Shoe,
  "Phụ kiện Pickleball": ShoppingBag,
  "Trang phục Pickleball": Shirt,
  "Tin tức Pickleball": FileText,
};

const productCategories = [
  { name: "Vợt Pickleball", icon: Racket, href: "/products?category=vot-pickleball" },
  { name: "Bóng Pickleball", icon: Circle, href: "/products?category=bong-pickleball" },
  { name: "Giày Pickleball", icon: Shoe, href: "/products?category=giay-pickleball" },
  { name: "Phụ kiện Pickleball", icon: ShoppingBag, href: "/products?category=phu-kien-pickleball" },
  { name: "Trang phục Pickleball", icon: Shirt, href: "/products?category=trang-phuc-pickleball" },
];

function NewsSidebar() {
  const { data: categories = [], isLoading, error } = useNewsCategories();
  
  if (error) {
    console.error("Error loading news categories:", error);
  }

  const getIcon = (categoryName: string) => {
    const IconComponent = categoryIcons[categoryName];
    return IconComponent && typeof IconComponent === 'function' ? IconComponent : FileText;
  };

  return (
    <div className="w-64 bg-white rounded-lg shadow-sm p-4 sticky top-4">
      <h3 className="font-bold text-lg mb-4 text-black">Danh mục</h3>
      
      <div className="space-y-1">
        {/* News Categories */}
        {!isLoading && categories && categories.length > 0 && categories.map((category) => {
          const Icon = getIcon(category);
          if (!Icon) return null;
          
          return (
            <Link
              key={category}
              href={`/news?category=${encodeURIComponent(category)}`}
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-emerald-50 transition-colors group"
            >
              <Icon className="h-4 w-4 text-emerald-600 group-hover:text-emerald-700" />
              <span className="text-sm text-gray-700 group-hover:text-emerald-600">
                {category}
              </span>
            </Link>
          );
        })}

        {/* Special Sections */}
        <Link
          href="/news?category=Khuyến mãi"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-brand-green-50 transition-colors group"
        >
          <Star className="h-4 w-4 text-brand-green-500 group-hover:text-brand-green-600" />
          <span className="text-sm text-gray-700 group-hover:text-brand-green-500">
            Chỉ có trong hôm nay
          </span>
        </Link>

        <Link
          href="/news?category=Khuyến mãi"
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-emerald-50 transition-colors group"
        >
          <Star className="h-4 w-4 text-brand-green-500 group-hover:text-brand-green-600" />
          <span className="text-sm text-gray-700 group-hover:text-brand-green-500">
            Khuyến mãi
          </span>
        </Link>

        <Link
          href="/news"
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-emerald-50 transition-colors group"
        >
          <Package className="h-4 w-4 text-brand-green-500 group-hover:text-brand-green-600" />
          <span className="text-sm text-gray-700 group-hover:text-brand-green-500">
            Có gì mới
          </span>
        </Link>

        {/* Product Categories */}
        {productCategories.map((item) => {
          const Icon = item.icon;
          if (!Icon) return null;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-brand-green-50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-brand-green-500 group-hover:text-brand-green-600" />
                <span className="text-sm text-gray-700 group-hover:text-brand-green-500">
                  {item.name}
                </span>
              </div>
              <span className="text-gray-400 group-hover:text-brand-green-500">›</span>
            </Link>
          );
        })}

        <Link
          href="/news"
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-brand-green-50 transition-colors group"
        >
          <FileText className="h-4 w-4 text-emerald-600 group-hover:text-emerald-700" />
          <span className="text-sm text-gray-700 group-hover:text-emerald-600">
            Tin tức Pickleball
          </span>
        </Link>
      </div>
    </div>
  );
}

export default NewsSidebar;
export { NewsSidebar };
