"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, ShoppingBag, Shield, Heart, MapPin, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const accountNavItems = [
  { href: "/account", label: "Tổng quan", icon: User },
  { href: "/account/profile", label: "Thông tin cá nhân", icon: User },
  { href: "/account/addresses", label: "Địa chỉ giao hàng", icon: MapPin },
  { href: "/account/orders", label: "Quản lý đơn hàng", icon: ShoppingBag },
  { href: "/account/wishlist", label: "Sản phẩm yêu thích", icon: Heart },
  { href: "/account/security", label: "Mật khẩu & bảo mật", icon: Shield },
];

export function AccountSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-20 left-4 z-40 bg-white border border-emerald-200 rounded-lg p-2 shadow-md hover:bg-emerald-50 transition-colors"
        aria-label="Toggle menu"
        style={{ top: 'calc(3.5rem + 1rem)' }}
      >
        {isMobileMenuOpen ? (
          <X className="h-5 w-5 text-emerald-700" />
        ) : (
          <Menu className="h-5 w-5 text-emerald-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed md:static top-0 left-0 h-full md:h-auto w-64 border-r bg-white p-4 z-40 transition-transform duration-300 ease-in-out shadow-sm md:shadow-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-lg text-emerald-900">Tài khoản</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1 hover:bg-emerald-100 rounded transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-emerald-700" />
          </button>
        </div>
        <nav className="space-y-2">
          {accountNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
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
    </>
  );
}
