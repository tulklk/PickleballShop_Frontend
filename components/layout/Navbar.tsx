"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, User, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/useAuth";
import { useCart, useCategories } from "@/lib/api/hooks";
import { useLogout } from "@/lib/api/hooks";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/api/client";
import { getGuestCartItemCount } from "@/lib/utils/guestCart";
import { Poppins } from "next/font/google";
import { CartPreview } from "./CartPreview";

import logo from "@/app/img/logopickleball.png";
import bannerDropdown from "@/app/img/homepage_img/1.jpg";

const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { data: cart } = useCart();
  const { data: categories } = useCategories();
  const logoutMutation = useLogout();
  const [searchQuery, setSearchQuery] = useState("");
  const [guestCartCount, setGuestCartCount] = useState(0);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const productTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update guest cart count when not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setGuestCartCount(getGuestCartItemCount());
      // Listen for storage changes to update count
      const handleStorageChange = () => {
        setGuestCartCount(getGuestCartItemCount());
      };
      window.addEventListener("storage", handleStorageChange);
      // Also check periodically (for same-tab updates)
      const interval = setInterval(() => {
        setGuestCartCount(getGuestCartItemCount());
      }, 1000);
      return () => {
        window.removeEventListener("storage", handleStorageChange);
        clearInterval(interval);
      };
    } else {
      setGuestCartCount(0);
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken) {
      try {
        await logoutMutation.mutateAsync({ refreshToken });
      } catch (error) {
        // Even if logout API fails, clear local session
        console.error("Logout error:", error);
      }
    }
    // Clear all tokens (useLogout hook already does this, but ensure it's done)
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const cartItemCount = isAuthenticated ? (cart?.totalItems || 0) : guestCartCount;
  const [showCartPreview, setShowCartPreview] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCartMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowCartPreview(true);
  };

  const handleCartMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowCartPreview(false);
    }, 200);
  };

  const handleProductMouseEnter = () => {
    if (productTimeoutRef.current) {
      clearTimeout(productTimeoutRef.current);
    }
    setShowProductDropdown(true);
  };

  const handleProductMouseLeave = () => {
    productTimeoutRef.current = setTimeout(() => {
      setShowProductDropdown(false);
    }, 200);
  };

  // Group categories for dropdown menu
  const menuCategories = [
    { name: "VỢT PICKLEBALL", href: "/products?category=vot", key: "vợt" },
    { name: "GIÀY PICKLEBALL", href: "/products?category=giay", key: "giày" },
    { name: "MÁY BẮN BÓNG PICKLEBALL", href: "/products?category=may", key: "máy" },
    { name: "COMBO VỢT, BÓNG...", href: "/products?category=combo", key: "combo" },
    { name: "BÓNG PICKLEBALL", href: "/products?category=bong", key: "bóng" },
    { name: "QUẦN ÁO TRANG PHỤC", href: "/products?category=trangphuc", key: "trang phục" },
    { name: "DÀNH CHO NEWBIE", href: "/products?category=newbie", key: "newbie" },
  ];

  const accessorySubItems = [
    "Balo & Túi Pickleball",
    "Dụng Cụ & Thiết Bị Hỗ Trợ",
    "Trợ Luyện Tập Pickleball",
    "Vỏ Vợt Pickleball",
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-emerald-100 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 p-1.5">
                <Image
                  src={logo}
                  alt="IKA Sport Pickleball"
                  priority
                  className="object-contain"
                  sizes="48px"
                />
              </span>
              <div className="leading-tight">
                <p className={`text-xl font-semibold text-emerald-950 tracking-tight ${poppins.className}`}>
                  IKA Sport
                </p>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                Trang chủ
              </Link>
              
              {/* Products Dropdown */}
              <div
                ref={productDropdownRef}
                className="relative"
                onMouseEnter={handleProductMouseEnter}
                onMouseLeave={handleProductMouseLeave}
              >
                <Link
                  href="/products"
                  className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                    pathname?.startsWith("/products")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  Sản phẩm
                  <ChevronDown className={`h-4 w-4 transition-transform ${showProductDropdown ? "rotate-180" : ""}`} />
                </Link>

                {/* Dropdown Menu */}
                {showProductDropdown && (
                  <div
                    className="absolute left-0 top-full pt-2 z-50"
                    onMouseEnter={handleProductMouseEnter}
                    onMouseLeave={handleProductMouseLeave}
                  >
                    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 min-w-[800px] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex gap-8">
                        {/* Categories Grid */}
                        <div className="flex-1 grid grid-cols-3 gap-x-8 gap-y-4">
                          {/* Column 1 */}
                          <div className="space-y-3">
                            <Link href="/products?search=vợt" className="block text-sm font-semibold text-gray-900 hover:text-emerald-600">
                              VỢT PICKLEBALL
                            </Link>
                            <Link href="/products?search=giày" className="block text-sm font-semibold text-gray-900 hover:text-emerald-600">
                              GIÀY PICKLEBALL
                            </Link>
                            <Link href="/products?search=bóng" className="block text-sm font-semibold text-gray-900 hover:text-emerald-600">
                              BÓNG PICKLEBALL
                            </Link>
                          </div>

                          {/* Column 2 */}
                          <div className="space-y-3">
                            <Link href="/products?search=máy" className="block text-sm font-semibold text-gray-900 hover:text-emerald-600">
                              MÁY BẮN BÓNG PICKLEBALL
                            </Link>
                            <Link href="/products?search=quần áo" className="block text-sm font-semibold text-gray-900 hover:text-emerald-600">
                              QUẦN ÁO TRANG PHỤC
                            </Link>
                          </div>

                          {/* Column 3 - PHỤ KIỆN with sub-items */}
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-gray-900">PHỤ KIỆN</p>
                            <div className="space-y-1 pl-2 border-l-2 border-emerald-200">
                              <Link href="/products?search=balo túi" className="block text-sm text-gray-600 hover:text-emerald-600">
                                Balo & Túi Pickleball
                              </Link>
                              <Link href="/products?search=dụng cụ" className="block text-sm text-gray-600 hover:text-emerald-600">
                                Dụng Cụ & Thiết Bị Hỗ Trợ
                              </Link>
                              <Link href="/products?search=luyện tập" className="block text-sm text-gray-600 hover:text-emerald-600">
                                Trợ Luyện Tập Pickleball
                              </Link>
                              <Link href="/products?search=vỏ vợt" className="block text-sm text-gray-600 hover:text-emerald-600">
                                Vỏ Vợt Pickleball
                              </Link>
                            </div>
                          </div>

                          {/* Additional Links */}
                          <div className="col-span-2 pt-2 border-t border-gray-100 mt-2">
                            <div className="flex gap-6">
                              <Link href="/products?search=combo" className="text-sm font-semibold text-gray-900 hover:text-emerald-600">
                                COMBO VỢT, BÓNG...
                              </Link>
                              <Link href="/products" className="text-sm font-semibold text-orange-500 hover:text-orange-600">
                                DÀNH CHO NEWBIE
                              </Link>
                            </div>
                          </div>
                        </div>

                        {/* Banner Image */}
                        <div className="w-[250px] h-[180px] relative rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={bannerDropdown}
                            alt="Pickleball Products"
                            fill
                            className="object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md mx-4"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            {/* Cart with Preview Dropdown */}
            <div
              ref={cartRef}
              className="relative"
              onMouseEnter={handleCartMouseEnter}
              onMouseLeave={handleCartMouseLeave}
            >
              <Link href="/cart">
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart Preview Dropdown */}
              {showCartPreview && (
                <div
                  className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                  onMouseEnter={handleCartMouseEnter}
                  onMouseLeave={handleCartMouseLeave}
                >
                  <CartPreview onClose={() => setShowCartPreview(false)} />
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      Quản trị
                    </Button>
                  </Link>
                )}
                <Link href="/account">
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Đăng ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

