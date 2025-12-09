"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, User, Search, ChevronDown, LogOut, Package, Settings, Menu, X, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/useAuth";
import { useCart, useCategories, useUserMe, useLogout } from "@/lib/api/hooks";
import type { ProductListDto, ProductListDtoPagedResultDto } from "@/lib/api/types";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getGuestCartItemCount } from "@/lib/utils/guestCart";
import { Poppins } from "next/font/google";
import { CartPreview } from "./CartPreview";
import { getProductUrl } from "@/lib/utils/productUrl";

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
  const queryClient = useQueryClient();
  // Get full user data with avatarUrl, enabled only when authenticated
  const { data: userMe } = useUserMe();
  const { data: cart } = useCart();
  const { data: categories } = useCategories();
  const logoutMutation = useLogout();
  
  // Refetch userMe when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      // Small delay to ensure token is set, then invalidate to trigger refetch
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["user", "me"] });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, queryClient]);
  const [searchQuery, setSearchQuery] = useState("");
  const [guestCartCount, setGuestCartCount] = useState(0);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const productTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const userTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<ProductListDto[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

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

  // Fetch search suggestions with debounce
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setIsSearchLoading(true);
        // Dùng getProducts với SearchTerm để bám sát logic backend
        const result: ProductListDtoPagedResultDto = await apiClient.getProducts({
          SearchTerm: searchQuery.trim(),
          PageSize: 5,
          Page: 1,
        } as any);
        setSuggestions(result?.items || []);
        setShowSuggestions(true);
      } catch (error) {
        console.warn("Search suggestions error:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  const handleSelectSuggestion = (product: ProductListDto) => {
    setShowSuggestions(false);
    setSearchQuery("");
    setSuggestions([]);
    // Use slug URL for SEO, fallback to ID
    const productUrl = getProductUrl(product);
    router.push(productUrl);
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

  const handleUserMouseEnter = () => {
    if (userTimeoutRef.current) {
      clearTimeout(userTimeoutRef.current);
    }
    setShowUserDropdown(true);
  };

  const handleUserMouseLeave = () => {
    userTimeoutRef.current = setTimeout(() => {
      setShowUserDropdown(false);
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
          <div className="flex items-center gap-3 md:gap-6">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
            
            <Link href="/" className="flex items-center gap-2 md:gap-3">
              <span className="relative inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-emerald-100 bg-emerald-50 p-1.5">
                <Image
                  src={logo}
                  alt="IKA Sport Pickleball"
                  priority
                  className="object-contain"
                  sizes="48px"
                />
              </span>
              <div className="leading-tight hidden sm:block">
                <p className={`text-lg md:text-xl font-semibold text-emerald-950 tracking-tight ${poppins.className}`}>
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
                    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 md:p-6 min-w-[300px] md:min-w-[800px] animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="flex gap-8">
                        {/* Categories Grid */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-x-4 md:gap-x-8 gap-y-4">
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
                        {showProductDropdown && (
                          <div className="hidden lg:block w-[250px] h-[180px] relative rounded-lg overflow-hidden shrink-0">
                          <Image
                            src={bannerDropdown}
                            alt="Pickleball Products"
                            fill
                            className="object-cover"
                              loading="lazy"
                              sizes="250px"
                          />
                        </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search - Desktop */}
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
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
                className="pl-10"
              />
              {showSuggestions && (
                <div className="absolute left-0 top-full mt-2 w-full bg-white border border-gray-200 shadow-lg rounded-lg z-50 max-h-80 overflow-y-auto">
                  {isSearchLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500">Đang tìm kiếm...</div>
                  )}
                  {!isSearchLoading && suggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp</div>
                  )}
                  {!isSearchLoading &&
                    suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3"
                      >
                        <div className="relative h-12 w-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                          {item.primaryImageUrl ? (
                            <Image
                              src={item.primaryImageUrl}
                              alt={item.name ? `${item.name} - Sản phẩm Pickleball` : "Sản phẩm Pickleball"}
                              fill
                              className="object-cover"
                              loading="lazy"
                              sizes="48px"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-xs text-gray-400">
                              No img
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {item.brand || "Sản phẩm"}
                          </p>
                          <div className="text-xs text-emerald-600 font-semibold">
                            {formatCurrency(item.price)}
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </form>

          {/* Mobile Search Button - Hidden */}
          {/* <Link href="/products" className="md:hidden">
            <Button variant="ghost" size="icon">
              <Search className="h-5 w-5" />
            </Button>
          </Link> */}

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

              {/* Cart Preview Dropdown - only show on desktop (md+) */}
              {showCartPreview && (
                <div
                  className="hidden md:block absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
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
                
                {/* User Avatar & Dropdown */}
                <div
                  ref={userDropdownRef}
                  className="relative"
                  onMouseEnter={handleUserMouseEnter}
                  onMouseLeave={handleUserMouseLeave}
                >
                  <div className="flex items-center gap-2 cursor-pointer px-2 py-1.5 rounded-md hover:bg-emerald-50 transition-colors">
                    {/* Avatar */}
                    <div className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-emerald-200 bg-emerald-50 shrink-0">
                      {userMe?.avatarUrl ? (
                        <Image
                          src={userMe.avatarUrl}
                          alt={userMe.fullName || "User"}
                          fill
                          className="object-cover"
                          loading="lazy"
                          sizes="32px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-emerald-100">
                          <span className="text-xs font-semibold text-emerald-700">
                            {(userMe?.fullName || user?.fullName || user?.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* User Name */}
                    <span className="text-sm font-medium text-gray-700 hidden md:block max-w-[120px] truncate">
                      {userMe?.fullName || user?.fullName || user?.email?.split("@")[0] || "User"}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform hidden md:block ${showUserDropdown ? "rotate-180" : ""}`} />
                  </div>

                  {/* User Dropdown Menu */}
                  {showUserDropdown && (
                    <div
                      className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200"
                      onMouseEnter={handleUserMouseEnter}
                      onMouseLeave={handleUserMouseLeave}
                    >
                      <div className="py-2">
                        <Link
                          href="/account/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <Settings className="h-4 w-4 text-emerald-600" />
                          <span>Quản lý tài khoản</span>
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <Package className="h-4 w-4 text-emerald-600" />
                          <span>Lịch sử đơn hàng</span>
                        </Link>
                        <Link
                          href="/account/wishlist"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                          onClick={() => setShowUserDropdown(false)}
                        >
                          <Heart className="h-4 w-4 text-emerald-600" />
                          <span>Sản phẩm yêu thích</span>
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            setShowUserDropdown(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 md:gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="text-xs md:text-sm">
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="text-xs md:text-sm px-2 md:px-4">Đăng ký</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-100 bg-white">
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
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

              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <Link
                  href="/"
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === "/" ? "bg-emerald-50 text-emerald-600" : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Trang chủ
                </Link>
                <Link
                  href="/products"
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname?.startsWith("/products")
                      ? "bg-emerald-50 text-emerald-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sản phẩm
                </Link>
                
                {/* Mobile Categories */}
                <div className="pl-4 space-y-1 border-l-2 border-emerald-100">
                  {menuCategories.map((category) => (
                    <Link
                      key={category.key}
                      href={category.href}
                      className="block px-4 py-2 rounded-md text-sm text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Mobile Auth Buttons - Hidden */}
              {/* {!isAuthenticated && (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <Link href="/login" className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Đăng nhập
                    </Button>
                  </Link>
                  <Link href="/register" className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full">Đăng ký</Button>
                  </Link>
                </div>
              )} */}

              {/* Mobile User Menu */}
              {isAuthenticated && (
                <div className="pt-4 border-t border-gray-100 space-y-2">
                  <Link
                    href="/account/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 text-emerald-600" />
                    <span>Quản lý tài khoản</span>
                  </Link>
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Package className="h-4 w-4 text-emerald-600" />
                    <span>Lịch sử đơn hàng</span>
                  </Link>
                  <Link
                    href="/account/wishlist"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Heart className="h-4 w-4 text-emerald-600" />
                    <span>Sản phẩm yêu thích</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 text-emerald-600" />
                      <span>Quản trị</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

