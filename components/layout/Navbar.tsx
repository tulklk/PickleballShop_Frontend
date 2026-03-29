"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, User, Search, ChevronDown, LogOut, Package, Settings, Menu, X, Heart, FileSearch, Plus, Minus, Bell, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/useAuth";
import { useCart, useUserMe, useLogout, useProducts, useCategoryTree } from "@/lib/api/hooks";
import type { ProductListDto, ProductListDtoPagedResultDto, CategoryDto, CategoryTreeDto } from "@/lib/api/types";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { getGuestCartItemCount } from "@/lib/utils/guestCart";
import { Poppins } from "next/font/google";
import { CartPreview } from "./CartPreview";
import { getProductUrl } from "@/lib/utils/productUrl";
import { DEBUG_API } from "@/lib/utils/debugApi";
import { useAdminNotificationCounts } from "@/components/admin/AdminNotificationsProvider";

import logo from "@/app/img/logopickleball.png";

/** Nhãn thông báo đơn hàng / tin nhắn trong menu chuông (admin) */
function orderBellLabel(count: number) {
  if (count <= 0) return "Chưa có đơn hàng mới";
  return `Bạn có ${count} đơn hàng mới`;
}

function messageBellLabel(count: number) {
  if (count <= 0) return "Chưa có tin nhắn mới";
  return `Bạn có ${count} tin nhắn mới`;
}

const poppins = Poppins({
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin } = useAuth();
  const {
    newOrdersCount,
    newSupportCount,
    clearOrderNotifications,
    clearSupportNotifications,
  } = useAdminNotificationCounts();
  const queryClient = useQueryClient();
  // Get full user data with avatarUrl, enabled only when authenticated
  const { data: userMe } = useUserMe();
  const { data: cart } = useCart();
  const { data: categoryTree } = useCategoryTree();
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
  const [expandedMenuItems, setExpandedMenuItems] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<ProductListDto[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Map category tree (new API) to old CategoryDto shape for reuse in menu
  const categories: CategoryDto[] | undefined = useMemo(() => {
    if (!categoryTree) return undefined;

    let fallbackId = 0;
    const mapNode = (node: CategoryTreeDto): CategoryDto => {
      const id = node.id || `tree-${fallbackId++}`;
      return {
        id,
        name: node.name ?? "",
        slug: null,
        description: node.description ?? null,
        parentCategoryId: null,
        parentCategoryName: null,
        subCategories: (node.children || [])?.map(mapNode) ?? [],
        productCount: node.productCount ?? 0,
      };
    };

    return categoryTree.map(mapNode);
  }, [categoryTree]);

  const getCategoryLink = (node: CategoryDto) =>
    node.id
      ? `/products?categoryId=${node.id}`
      : `/products?search=${encodeURIComponent(node.name || "")}`;

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
        if (DEBUG_API) {
          console.error("Logout error:", error);
        }
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
      setShowSearchOverlay(false);
      setShowSuggestions(false);
      setIsMobileMenuOpen(false);
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
        if (DEBUG_API) {
          console.warn("Search suggestions error:", error);
        }
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
    setShowSearchOverlay(false);
    setSearchQuery("");
    setSuggestions([]);
    // Use slug URL for SEO, fallback to ID
    const productUrl = getProductUrl(product);
    router.push(productUrl);
  };

  // Focus search input when overlay opens
  useEffect(() => {
    if (showSearchOverlay && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchOverlay]);

  // Close search overlay on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showSearchOverlay) {
        setShowSearchOverlay(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showSearchOverlay]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchOverlay(false);
      setShowSuggestions(false);
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const cartItemCount = isAuthenticated ? (cart?.totalItems || 0) : guestCartCount;
  const [showCartPreview, setShowCartPreview] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showAdminNotifDropdown, setShowAdminNotifDropdown] = useState(false);
  const adminNotifRef = useRef<HTMLDivElement>(null);
  const adminNotifTotal = newOrdersCount + newSupportCount;

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

  useEffect(() => {
    if (!showAdminNotifDropdown) return;
    const handler = (e: MouseEvent) => {
      if (
        adminNotifRef.current &&
        !adminNotifRef.current.contains(e.target as Node)
      ) {
        setShowAdminNotifDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAdminNotifDropdown]);

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
              className="min-h-11 min-w-11 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              aria-label={isMobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
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
              
              <Link
                href="/news"
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname?.startsWith("/news")
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                Tin tức
              </Link>
              
              {/* Products Dropdown */}
              <div
                ref={productDropdownRef}
                className="relative"
                onMouseEnter={handleProductMouseEnter}
                onMouseLeave={handleProductMouseLeave}
              >
                <div
                  className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 cursor-pointer ${
                    pathname?.startsWith("/products")
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  Sản phẩm
                  <ChevronDown className={`h-4 w-4 transition-transform ${showProductDropdown ? "rotate-180" : ""}`} />
                </div>

                {/* Mega Menu Dropdown */}
                {showProductDropdown && (
                  <div
                    className="fixed left-0 right-0 top-16 z-50"
                    onMouseEnter={handleProductMouseEnter}
                    onMouseLeave={handleProductMouseLeave}
                  >
                    <div className="bg-white shadow-xl border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="container mx-auto px-4 py-6">
                        {/* Dynamic Categories Grid (new API tree) */}
                        {categories && categories.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {categories.map((category) => (
                              <div key={category.id} className="space-y-2">
                                <Link
                                  href={getCategoryLink(category)}
                                  className="block text-sm font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wide"
                                  onClick={() => setShowProductDropdown(false)}
                                >
                                  {category.name}
                                </Link>
                                <div className="space-y-1">
                                  {(category.subCategories || []).slice(0, 8).map((child) => (
                                    <Link
                                      key={child.id || child.name}
                                      href={getCategoryLink(child)}
                                      className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors"
                                      onClick={() => setShowProductDropdown(false)}
                                    >
                                      {child.name}
                                    </Link>
                                  ))}
                                  {(category.subCategories?.length || 0) > 8 && (
                                    <Link
                                      href={getCategoryLink(category)}
                                      className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                                      onClick={() => setShowProductDropdown(false)}
                                    >
                                      Xem thêm →
                                    </Link>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          /* Fallback Static Categories */
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            <div className="space-y-2">
                              <Link href="/products?search=vợt" className="block text-sm font-bold text-emerald-600 hover:text-emerald-700 uppercase" onClick={() => setShowProductDropdown(false)}>
                                VỢT PICKLEBALL
                              </Link>
                              <div className="space-y-1">
                                <Link href="/products?search=vợt joola" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Vợt Pickleball Joola</Link>
                                <Link href="/products?search=vợt head" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Vợt Pickleball Head</Link>
                                <Link href="/products?search=vợt selkirk" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Vợt Pickleball Selkirk</Link>
                                <Link href="/products?search=vợt" className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium" onClick={() => setShowProductDropdown(false)}>Xem thêm →</Link>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Link href="/products?search=giày" className="block text-sm font-bold text-emerald-600 hover:text-emerald-700 uppercase" onClick={() => setShowProductDropdown(false)}>
                                GIÀY PICKLEBALL
                              </Link>
                              <div className="space-y-1">
                                <Link href="/products?search=giày yonex" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Giày Pickleball Yonex</Link>
                                <Link href="/products?search=giày asics" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Giày Pickleball Asics</Link>
                                <Link href="/products?search=giày adidas" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Giày Pickleball Adidas</Link>
                                <Link href="/products?search=giày" className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium" onClick={() => setShowProductDropdown(false)}>Xem thêm →</Link>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Link href="/products?search=bóng" className="block text-sm font-bold text-emerald-600 hover:text-emerald-700 uppercase" onClick={() => setShowProductDropdown(false)}>
                                BÓNG PICKLEBALL
                              </Link>
                              <div className="space-y-1">
                                <Link href="/products?search=bóng joola" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Bóng Pickleball Joola</Link>
                                <Link href="/products?search=bóng franklin" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Bóng Pickleball Franklin</Link>
                                <Link href="/products?search=bóng onix" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Bóng Pickleball Onix</Link>
                                <Link href="/products?search=bóng" className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium" onClick={() => setShowProductDropdown(false)}>Xem thêm →</Link>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Link href="/products?search=trang phục" className="block text-sm font-bold text-emerald-600 hover:text-emerald-700 uppercase" onClick={() => setShowProductDropdown(false)}>
                                TRANG PHỤC
                              </Link>
                              <div className="space-y-1">
                                <Link href="/products?search=áo" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Áo Pickleball</Link>
                                <Link href="/products?search=quần" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Quần Pickleball</Link>
                                <Link href="/products?search=váy" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Váy Pickleball</Link>
                                <Link href="/products?search=trang phục" className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium" onClick={() => setShowProductDropdown(false)}>Xem thêm →</Link>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Link href="/products?search=túi" className="block text-sm font-bold text-emerald-600 hover:text-emerald-700 uppercase" onClick={() => setShowProductDropdown(false)}>
                                TÚI & BALO
                              </Link>
                              <div className="space-y-1">
                                <Link href="/products?search=túi joola" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Túi Pickleball Joola</Link>
                                <Link href="/products?search=túi selkirk" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Túi Pickleball Selkirk</Link>
                                <Link href="/products?search=balo" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Balo Pickleball</Link>
                                <Link href="/products?search=túi" className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium" onClick={() => setShowProductDropdown(false)}>Xem thêm →</Link>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Link href="/products?search=phụ kiện" className="block text-sm font-bold text-emerald-600 hover:text-emerald-700 uppercase" onClick={() => setShowProductDropdown(false)}>
                                PHỤ KIỆN
                              </Link>
                              <div className="space-y-1">
                                <Link href="/products?search=grip" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Quấn cán vợt (Grip)</Link>
                                <Link href="/products?search=lưới" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Lưới Pickleball</Link>
                                <Link href="/products?search=phụ kiện" className="block text-sm text-gray-600 hover:text-emerald-600" onClick={() => setShowProductDropdown(false)}>Phụ kiện khác</Link>
                                <Link href="/products" className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium" onClick={() => setShowProductDropdown(false)}>Xem tất cả →</Link>
                              </div>
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Order Lookup Link */}
              <Link
                href="/order-lookup"
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-1 ${
                  pathname?.startsWith("/order-lookup")
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <FileSearch className="h-4 w-4" />
                Tra cứu đơn hàng
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Icon Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearchOverlay(true)}
              className="min-h-11 min-w-11 hover:bg-emerald-50"
              aria-label="Mở tìm kiếm sản phẩm"
            >
              <Search className="h-5 w-5" aria-hidden />
            </Button>
            {/* Cart with Preview Dropdown */}
            <div
              ref={cartRef}
              className="relative"
              onMouseEnter={handleCartMouseEnter}
              onMouseLeave={handleCartMouseLeave}
            >
              <Link
                href="/cart"
                aria-label={
                  cartItemCount > 0
                    ? `Giỏ hàng, ${cartItemCount} sản phẩm`
                    : "Giỏ hàng"
                }
              >
                <Button variant="ghost" size="icon" className="relative min-h-11 min-w-11">
                  <ShoppingCart className="h-5 w-5" aria-hidden />
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

            {isAuthenticated && isAdmin && (
              <div ref={adminNotifRef} className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-emerald-50"
                  aria-label="Thông báo quản trị"
                  onClick={() =>
                    setShowAdminNotifDropdown((open) => !open)
                  }
                >
                  <Bell className="h-5 w-5" strokeWidth={1.75} />
                  {adminNotifTotal > 0 && (
                    <span className="pointer-events-none absolute -right-0.5 -top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
                      {adminNotifTotal > 99 ? "99+" : adminNotifTotal}
                    </span>
                  )}
                </Button>
                {showAdminNotifDropdown && (
                  <div className="absolute right-0 top-full z-50 mt-2 min-w-[min(100vw-2rem,320px)] max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white py-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Tam giác nối lên chuông */}
                    <div
                      className="absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-gray-200 bg-white"
                      aria-hidden
                    />
                    <p className="relative px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Thông báo
                    </p>
                    <Link
                      href="/admin/orders"
                      className="relative flex items-start gap-3 px-3 py-2.5 text-sm hover:bg-emerald-50"
                      onClick={() => {
                        setShowAdminNotifDropdown(false);
                        clearOrderNotifications();
                      }}
                    >
                      <Package
                        className={`mt-0.5 h-4 w-4 shrink-0 ${newOrdersCount > 0 ? "text-emerald-600" : "text-gray-400"}`}
                      />
                      <span
                        className={`flex-1 leading-snug ${newOrdersCount > 0 ? "font-medium text-gray-900" : "text-muted-foreground"}`}
                      >
                        {orderBellLabel(newOrdersCount)}
                      </span>
                    </Link>
                    <Link
                      href="/admin/chat"
                      className="relative flex items-start gap-3 px-3 py-2.5 text-sm hover:bg-emerald-50"
                      onClick={() => {
                        setShowAdminNotifDropdown(false);
                        clearSupportNotifications();
                      }}
                    >
                      <MessageCircle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${newSupportCount > 0 ? "text-emerald-600" : "text-gray-400"}`}
                      />
                      <span
                        className={`flex-1 leading-snug ${newSupportCount > 0 ? "font-medium text-gray-900" : "text-muted-foreground"}`}
                      >
                        {messageBellLabel(newSupportCount)}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            )}

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
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 md:h-10 md:w-10 rounded-full hover:bg-gray-100"
                    aria-label="Đăng nhập"
                  >
                    <User className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div 
          className={`fixed inset-0 bg-black/50 z-[99] md:hidden transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => {
            setIsMobileMenuOpen(false);
            setExpandedMenuItems(new Set());
          }}
        />
        
        {/* Mobile Menu Slide-in Panel - Matching Image Design */}
        <div 
          id="mobile-navigation"
          className={`fixed top-0 left-0 h-screen w-[85%] max-w-[320px] bg-white z-[100] md:hidden transform transition-transform duration-300 ease-out shadow-2xl ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ pointerEvents: isMobileMenuOpen ? 'auto' : 'none' }}
        >
          {/* Mobile Menu Content */}
          <div className="flex flex-col h-full overflow-y-auto bg-white">
            {/* Emerald Green Header with Title and Close Button */}
            <div className="bg-emerald-500 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
              <h3 className="font-semibold text-sm uppercase flex-1 text-center">DANH MỤC SẢN PHẨM</h3>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setExpandedMenuItems(new Set());
                }}
                className="p-1 hover:bg-emerald-600 rounded transition-colors ml-2"
                aria-label="Đóng menu"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Menu Items */}
            <div className="flex-1 bg-white">
              {/* TRANG CHỦ */}
              <Link
                href="/"
                className={`block px-4 py-3 text-sm font-medium uppercase text-gray-900 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  pathname === "/" ? "bg-gray-50" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                TRANG CHỦ
              </Link>

              {/* SẢN PHẨM - Expandable */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => {
                    const newSet = new Set(expandedMenuItems);
                    if (newSet.has('products')) {
                      newSet.delete('products');
                    } else {
                      newSet.add('products');
                    }
                    setExpandedMenuItems(newSet);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium uppercase text-gray-900 hover:bg-gray-50 transition-colors ${
                    pathname?.startsWith("/products") ? "bg-gray-50" : ""
                  }`}
                >
                  <span>SẢN PHẨM</span>
                  {expandedMenuItems.has('products') ? (
                    <Minus className="h-4 w-4 text-gray-900" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-900" />
                  )}
                </button>
                {/* Sub-categories */}
                {expandedMenuItems.has('products') && categories && categories.length > 0 && (
                  <div className="bg-white">
                    {categories.map((category) => {
                      const hasChildren = category.subCategories && category.subCategories.length > 0;
                      const categoryKey = `category-${category.id}`;
                      const isCategoryExpanded = expandedMenuItems.has(categoryKey);
                      
                      return (
                        <div key={category.id}>
                          {hasChildren ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  const newSet = new Set(expandedMenuItems);
                                  if (newSet.has(categoryKey)) {
                                    newSet.delete(categoryKey);
                                  } else {
                                    newSet.add(categoryKey);
                                  }
                                  setExpandedMenuItems(newSet);
                                }}
                                className="w-full flex items-center justify-between px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                              >
                                <span>{category.name}</span>
                                {isCategoryExpanded ? (
                                  <Minus className="h-4 w-4 text-gray-700" />
                                ) : (
                                  <Plus className="h-4 w-4 text-gray-700" />
                                )}
                              </button>
                              {/* Child categories */}
                              {isCategoryExpanded && category.subCategories && (
                                <div className="bg-gray-50">
                                  {category.subCategories.map((child) => (
                                    <Link
                                      key={child.id}
                                      href={`/products?categoryId=${child.id}`}
                                      className="block px-8 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-emerald-600 transition-colors"
                                      onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                      {child.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <Link
                              href={`/products?categoryId=${category.id}`}
                              className="block px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {category.name}
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SALE OFF */}
              <Link
                href="/products?search=sale"
                className={`block px-4 py-3 text-sm font-medium uppercase text-gray-900 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  pathname?.includes("sale") ? "bg-gray-50" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                SALE OFF
              </Link>

              {/* TIN TỨC */}
              <Link
                href="/news"
                className={`block px-4 py-3 text-sm font-medium uppercase text-gray-900 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  pathname?.startsWith("/news") ? "bg-gray-50" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                TIN TỨC
              </Link>

              {/* CHÍNH SÁCH NHƯỢNG QUYỀN */}
              <Link
                href="/franchise"
                className={`block px-4 py-3 text-sm font-medium uppercase text-gray-900 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  pathname?.startsWith("/franchise") ? "bg-gray-50" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                CHÍNH SÁCH NHƯỢNG QUYỀN
              </Link>

              {/* HƯỚNG DẪN - Expandable */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => {
                    const newSet = new Set(expandedMenuItems);
                    if (newSet.has('guide')) {
                      newSet.delete('guide');
                    } else {
                      newSet.add('guide');
                    }
                    setExpandedMenuItems(newSet);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium uppercase text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  <span>HƯỚNG DẪN</span>
                  {expandedMenuItems.has('guide') ? (
                    <Minus className="h-4 w-4 text-gray-900" />
                  ) : (
                    <Plus className="h-4 w-4 text-gray-900" />
                  )}
                </button>
                {/* Sub-items for Guide */}
                {expandedMenuItems.has('guide') && (
                  <div className="bg-white">
                    <Link
                      href="/guide/shopping"
                      className="block px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Hướng dẫn mua hàng
                    </Link>
                    <Link
                      href="/guide/payment"
                      className="block px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Hướng dẫn thanh toán
                    </Link>
                    <Link
                      href="/guide/shipping"
                      className="block px-6 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Hướng dẫn vận chuyển
                    </Link>
                  </div>
                )}
              </div>

              {/* CÔNG NGHỆ SẢN PHẨM */}
              <Link
                href="/technology"
                className={`block px-4 py-3 text-sm font-medium uppercase text-gray-900 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  pathname?.startsWith("/technology") ? "bg-gray-50" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                CÔNG NGHỆ SẢN PHẨM
              </Link>

              {/* GIỚI THIỆU */}
              <Link
                href="/about"
                className={`block px-4 py-3 text-sm font-medium uppercase text-gray-900 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  pathname?.startsWith("/about") ? "bg-gray-50" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                GIỚI THIỆU
              </Link>

              {/* LIÊN HỆ */}
              <Link
                href="/contact"
                className={`block px-4 py-3 text-sm font-medium uppercase text-gray-900 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  pathname?.startsWith("/contact") ? "bg-gray-50" : ""
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                LIÊN HỆ
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Search Overlay Dropdown */}
      {showSearchOverlay && (
        <>
          {/* Background Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => {
              setShowSearchOverlay(false);
              setShowSuggestions(false);
            }}
          />
          
          {/* Search Bar Container - White background like reference */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-gray-100 shadow-lg animate-in slide-in-from-top duration-200">
            <div className="container mx-auto px-4 py-4">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-4">
                {/* Search Icon */}
                <Search className="h-5 w-5 text-gray-500 shrink-0" />
                
                {/* Search Input Box */}
                <div className="flex-1">
                  <Input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true);
                    }}
                    className="w-full h-10 bg-white border border-gray-300 rounded-sm text-gray-900 placeholder:text-gray-400 text-base focus:border-gray-400 focus:ring-1 focus:ring-gray-400"
                  />
                </div>
                
                {/* Close Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowSearchOverlay(false);
                    setShowSuggestions(false);
                    setSearchQuery("");
                    setSuggestions([]);
                  }}
                  className="min-h-11 min-w-11 shrink-0 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
                  aria-label="Đóng tìm kiếm"
                >
                  <X className="h-6 w-6" aria-hidden />
                </Button>
              </form>
              
              {/* Search Suggestions */}
              {showSuggestions && (
                <div className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto">
                  {isSearchLoading && (
                    <div className="px-4 py-3 text-sm text-gray-500">Đang tìm kiếm...</div>
                  )}
                  {!isSearchLoading && suggestions.length === 0 && searchQuery.trim().length >= 2 && (
                    <div className="px-4 py-3 text-sm text-gray-500">Không tìm thấy sản phẩm phù hợp</div>
                  )}
                  {!isSearchLoading &&
                    suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
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
          </div>
        </>
      )}
    </nav>
  );
}

