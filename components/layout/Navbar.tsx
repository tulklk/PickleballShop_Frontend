"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingCart, User, Search, ChevronDown, LogOut, Package, Settings, Menu, X, Heart, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/useAuth";
import { useCart, useCategories, useUserMe, useLogout, useProducts } from "@/lib/api/hooks";
import type { ProductListDto, ProductListDtoPagedResultDto, CategoryDto } from "@/lib/api/types";
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

// Component to display products under each category in mega menu
function CategoryMenuItems({ 
  category, 
  onClose 
}: { 
  category: CategoryDto; 
  onClose: () => void;
}) {
  const { data: productsData } = useProducts({
    CategoryId: category.id,
    PageSize: 8,
    Page: 1,
  });

  const products = productsData?.items || [];

  // If category has subcategories, show them
  if (category.subCategories && category.subCategories.length > 0) {
    return (
      <div className="space-y-1">
        {category.subCategories.slice(0, 8).map((sub) => (
          <Link
            key={sub.id}
            href={`/products?categoryId=${sub.id}`}
            className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors"
            onClick={onClose}
          >
            {sub.name}
          </Link>
        ))}
        {category.subCategories.length > 8 && (
          <Link
            href={`/products?categoryId=${category.id}`}
            className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            onClick={onClose}
          >
            Xem thêm →
          </Link>
        )}
      </div>
    );
  }

  // Otherwise show products
  if (products.length > 0) {
    return (
      <div className="space-y-1">
        {products.slice(0, 8).map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug || product.id}`}
            className="block text-sm text-gray-600 hover:text-emerald-600 transition-colors truncate"
            onClick={onClose}
            title={product.name || ""}
          >
            {product.name}
          </Link>
        ))}
        {(category.productCount || 0) > 8 && (
          <Link
            href={`/products?categoryId=${category.id}`}
            className="block text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            onClick={onClose}
          >
            Xem thêm →
          </Link>
        )}
      </div>
    );
  }

  // Loading/empty state
  return (
    <Link
      href={`/products?categoryId=${category.id}`}
      className="block text-sm text-emerald-600 hover:text-emerald-700"
      onClick={onClose}
    >
      Xem {category.productCount || 0} sản phẩm →
    </Link>
  );
}

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
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
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

                {/* Mega Menu Dropdown */}
                {showProductDropdown && (
                  <div
                    className="fixed left-0 right-0 top-16 z-50"
                    onMouseEnter={handleProductMouseEnter}
                    onMouseLeave={handleProductMouseLeave}
                  >
                    <div className="bg-white shadow-xl border-t border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="container mx-auto px-4 py-6">
                        {/* Dynamic Categories Grid */}
                        {categories && categories.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {categories.map((category) => (
                              <div key={category.id} className="space-y-2">
                                {/* Category Header */}
                                <Link
                                  href={`/products?categoryId=${category.id}`}
                                  className="block text-sm font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wide"
                                  onClick={() => setShowProductDropdown(false)}
                                >
                                  {category.name}
                                </Link>
                                
                                {/* Products List */}
                                <CategoryMenuItems 
                                  category={category} 
                                  onClose={() => setShowProductDropdown(false)} 
                                />
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
                        
                        {/* Bottom Banner/Links */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex gap-6">
                            <Link 
                              href="/products" 
                              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                              onClick={() => setShowProductDropdown(false)}
                            >
                              Xem tất cả sản phẩm →
                            </Link>
                            <Link 
                              href="/products?sort=newest" 
                              className="text-sm font-semibold text-orange-500 hover:text-orange-600"
                              onClick={() => setShowProductDropdown(false)}
                            >
                              🔥 Sản phẩm mới nhất
                            </Link>
                            <Link 
                              href="/products?discount=true" 
                              className="text-sm font-semibold text-red-500 hover:text-red-600"
                              onClick={() => setShowProductDropdown(false)}
                            >
                              💥 Đang giảm giá
                            </Link>
                          </div>
                          <div className="hidden lg:block w-[200px] h-[60px] relative rounded-lg overflow-hidden">
                            <Image
                              src={bannerDropdown}
                              alt="Pickleball Products"
                              fill
                              className="object-cover"
                              loading="lazy"
                              sizes="200px"
                            />
                          </div>
                        </div>
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
              className="hover:bg-emerald-50"
            >
              <Search className="h-5 w-5" />
            </Button>
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

        {/* Mobile Menu Overlay */}
        <div 
          className={`fixed inset-0 bg-black/50 z-[99] md:hidden transition-opacity duration-300 ${
            isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Mobile Menu Slide-in Panel */}
        <div 
          className={`fixed top-0 left-0 h-screen w-[85%] max-w-[320px] bg-white z-[100] md:hidden transform transition-transform duration-300 ease-out shadow-2xl ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ pointerEvents: isMobileMenuOpen ? 'auto' : 'none' }}
        >
          {/* Mobile Menu Content */}
          <div className="flex flex-col h-full overflow-y-auto bg-white pb-4">
            {/* Close Button Row */}
            <div className="flex justify-end px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Đóng menu"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            {/* Mobile Search */}
            <div className="p-4 border-b border-gray-100">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setShowSearchOverlay(true);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors text-sm"
              >
                <Search className="h-5 w-5" />
                <span>Tìm kiếm sản phẩm...</span>
              </button>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 py-2">
              <Link
                href="/"
                className={`flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${
                  pathname === "/" ? "text-emerald-600 bg-emerald-50" : "text-gray-800 hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                TRANG CHỦ
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              </Link>
              <Link
                href="/products"
                className={`flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${
                  pathname?.startsWith("/products") ? "text-emerald-600 bg-emerald-50" : "text-gray-800 hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                SẢN PHẨM
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              </Link>
              <Link
                href="/news"
                className={`flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${
                  pathname?.startsWith("/news") ? "text-emerald-600 bg-emerald-50" : "text-gray-800 hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                TIN TỨC
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              </Link>
              <Link
                href="/order-lookup"
                className={`flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors border-b border-gray-100 ${
                  pathname?.startsWith("/order-lookup") ? "text-emerald-600 bg-emerald-50" : "text-gray-800 hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                TRA CỨU ĐƠN HÀNG
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              </Link>
              
              {/* Categories from API */}
              {categories && categories.length > 0 && (
                <div className="border-b border-gray-100">
                  <div className="px-6 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
                    Danh mục sản phẩm
                  </div>
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/products?categoryId=${category.id}`}
                      className="flex items-center justify-between px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 hover:text-emerald-600 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {category.name}
                      <span className="text-[11px] text-gray-400">
                        {category.productCount || 0}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Auth Section removed per request */}
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
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 shrink-0"
                >
                  <X className="h-6 w-6" />
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

