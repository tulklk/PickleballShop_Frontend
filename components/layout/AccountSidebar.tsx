"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, ShoppingBag, Shield, Heart } from "lucide-react";

const accountNavItems = [
  { href: "/account", label: "Tổng quan", icon: User },
  { href: "/account/profile", label: "Thông tin cá nhân", icon: User },
  { href: "/account/orders", label: "Quản lý đơn hàng", icon: ShoppingBag },
  { href: "/account/wishlist", label: "Sản phẩm yêu thích", icon: Heart },
  { href: "/account/security", label: "Mật khẩu & bảo mật", icon: Shield },
];

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-emerald-50/30 p-4">
      <h2 className="font-bold text-lg mb-6 text-emerald-900">Tài khoản</h2>
      <nav className="space-y-2">
        {accountNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-emerald-600 text-white shadow-md"
                  : "hover:bg-emerald-100 text-emerald-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

