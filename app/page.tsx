"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Trophy, Zap, ChevronLeft, ChevronRight, Star, Clock, Truck, Phone, Mail, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductGridSkeleton } from "@/components/shared/ProductSkeleton";
import { useProducts, useCategories, useCategoryTree, useNews } from "@/lib/api/hooks";
import { apiClient } from "@/lib/api/client";
import { ProductCard } from "@/components/shared/ProductCard";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { toast } from "sonner";
import { getProductUrl } from "@/lib/utils/productUrl";

// Import homepage images
import banner1 from "@/app/img/homepage_img/1.jpg";
import banner2 from "@/app/img/homepage_img/2.jpg";
import banner3 from "@/app/img/homepage_img/3.jpg";
import banner4 from "@/app/img/homepage_img/4.jpg";
import banner5 from "@/app/img/homepage_img/5.jpg";
import banner11 from "@/app/img/homepage_img/11.jpg";
import banner6 from "@/app/img/homepage_img/6.png";
import banner7 from "@/app/img/homepage_img/7.jpg";
import banner8 from "@/app/img/homepage_img/8.jpg";
import banner9 from "@/app/img/homepage_img/9.jpg";
import banner10 from "@/app/img/homepage_img/6.jpg";
import banner12 from "@/app/img/homepage_img/12.jpg";

export default function HomePage() {
  const queryClient = useQueryClient();
  
  // Fetch all data needed for homepage - these will be used by child components
  const { data: categories, isLoading: isLoadingCategories } = useCategories();
  const { data: allProductsData, isLoading: isLoadingAllProducts } = useProducts({ PageSize: 50 });
  const { data: flashSaleProductsData, isLoading: isLoadingFlashSale } = useProducts({ PageSize: 20 });

  // Prefetch category-specific products when categories are loaded
  useEffect(() => {
    if (categories && categories.length > 0) {
      const categoryConfigs = [
        { searchKey: "vợt" },
        { searchKey: "giày" },
        { searchKey: "phụ kiện" },
        { searchKey: "bóng" },
      ];

      categoryConfigs.forEach((config) => {
        const category = categories.find((c) =>
          c.name?.toLowerCase().includes(config.searchKey.toLowerCase())
        );
        if (category?.id) {
          // Prefetch in background
          queryClient.prefetchQuery({
            queryKey: ["products", { PageSize: 8, CategoryId: category.id }],
            queryFn: () => apiClient.getProducts({ PageSize: 8, CategoryId: category.id }),
            staleTime: 15 * 60 * 1000,
            gcTime: 45 * 60 * 1000,
          });
        }
      });
    }
  }, [categories, queryClient]);

  // Generate structured data (JSON-LD) for SEO
  const siteUrl = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || "https://pickleballshop.com");
  
  const organizationStructuredData = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: "IKA Sport",
    description: "Cửa hàng chuyên cung cấp vợt Pickleball, giày Pickleball, bóng và phụ kiện chính hãng tại Việt Nam",
    url: siteUrl,
    logo: `${siteUrl}/img/logopickleball.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "236 Mỹ Đình, Phường Mỹ Đình 2",
      addressLocality: "Nam Từ Liêm",
      addressRegion: "Hà Nội",
      addressCountry: "VN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+84-824-010-188",
      contactType: "customer service",
      email: "support@ikasport.com",
      availableLanguage: "Vietnamese",
    },
    sameAs: [
      // Add social media links when available
    ],
  };

  return (
    <>
      {/* Structured Data (JSON-LD) for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />
      <div className="min-h-screen bg-white">
      {/* Hero Banner Slider */}
      <HeroBannerSlider />

      {/* Feature Banners under hero (image-based like reference) */}
      <FeatureBanners />

      {/* Flash Sale Section */}
      <FlashSaleSection sharedProductsData={flashSaleProductsData} isLoading={isLoadingFlashSale} />

      {/* New Products Section */}
      <NewProductsSection sharedProductsData={allProductsData} isLoading={isLoadingAllProducts} />

      {/* Category Sections */}
      <CategoryProductsSection sharedCategories={categories} isLoadingCategories={isLoadingCategories} />

      {/* Trending & Popular Section */}
      <TrendingSection sharedProductsData={allProductsData} isLoading={isLoadingAllProducts} />

      {/* Category Links Grid */}
      <CategoryLinksGrid sharedCategories={categories} isLoading={isLoadingCategories} />

      {/* Latest News Section */}
      <LatestNewsSection />

      {/* Newsletter & Contact */}
      <NewsletterSection />

      {/* Trust Badges */}
      <TrustBadges />
    </div>
    </>
  );
}

function HeroBannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const banners = [banner1, banner2, banner3, banner4];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  return (
    <section className="relative overflow-hidden">
      <div className="flex relative">
        {/* Main Banner */}
        <div className="relative w-full lg:w-2/3 h-[300px] md:h-[450px] overflow-hidden">
          {banners.map((banner, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                idx === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={banner}
                alt={`Banner ${idx + 1}`}
                fill
                sizes="100vw"
                className="object-cover"
                priority={idx === 0}
              />
            </div>
          ))}
          
          {/* Navigation Arrows */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg z-10"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length)}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-lg z-10"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % banners.length)}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, idx) => (
              <button
                key={idx}
                className={`w-3 h-3 rounded-full ${
                  idx === currentSlide ? "bg-emerald-500 w-8" : "bg-white/60 hover:bg-white/80"
                }`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </div>

        {/* Side Banners */}
        <div className="hidden lg:flex flex-col w-1/3 gap-2 pl-2">
          <Link href="/products" className="relative h-[224px] overflow-hidden rounded-lg group">
            <Image
              src={banner5}
              alt="Side Banner 1"
              fill
              sizes="(max-width: 1024px) 0vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent flex items-end p-4">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">XEM NGAY</Button>
            </div>
          </Link>
          <Link href="/products" className="relative h-[224px] overflow-hidden rounded-lg group bg-white">
            <Image
              src={banner11}
              alt="JOOLA Pro IV New Colorway Vietnam Edition"
              fill
              sizes="(max-width: 1024px) 0vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 z-10">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl px-8 py-2.5 text-sm font-bold tracking-wide">
                XEM NGAY
              </Button>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeatureBanners() {
  return (
    <section className="container mx-auto px-3 md:px-4 pt-2 pb-4 md:py-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {/* Big left banner - Sản phẩm mới */}
        <Link
          href="/products"
          className="relative overflow-hidden rounded-2xl group lg:col-span-2 bg-black"
        >
          <Image
            src={banner10}
            alt="Sản phẩm mới Pickleball"
            fill
            sizes="(max-width: 768px) 100vw, 66vw"
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-linear-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-between p-6 md:p-8">
            <div className="space-y-2">
              <p className="text-xs md:text-sm font-semibold tracking-[0.2em] text-white/70">
                SẢN PHẨM MỚI
              </p>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                JOOLA 3S DUAL
              </h2>
              <p className="text-sm md:text-base text-white/80">ĐÃ CÓ MẶT TẠI IKA SPORT</p>
            </div>
            <div className="mt-4">
              <Button className="bg-white text-black hover:bg-primary hover:text-white px-6 font-semibold">
                XEM NGAY
              </Button>
            </div>
          </div>
        </Link>

        {/* Right banner - Tiêu điểm tháng */}
        <Link
          href="/products"
          className="relative overflow-hidden rounded-2xl group bg-black"
        >
          <Image
            src={banner9}
            alt="Tiêu điểm tháng - sản phẩm nổi bật"
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-black/70 flex flex-col justify-between p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-[0.2em] text-emerald-400">
                TIÊU ĐIỂM
              </p>
              <h3 className="text-lg md:text-xl font-bold text-white">THÁNG NÀY</h3>
              <p className="text-sm text-white/80">
                Bộ sưu tập vợt nổi bật được nhiều vận động viên lựa chọn.
              </p>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black px-4 text-sm font-semibold"
              >
                XEM NGAY
              </Button>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}

function FlashSaleSection({ 
  sharedProductsData, 
  isLoading 
}: { 
  sharedProductsData?: any;
  isLoading?: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState({ hours: 22, minutes: 37, seconds: 39 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollRef2 = useRef<HTMLDivElement>(null);

  // Use shared data if provided, otherwise fetch independently
  const { data: productsData, isLoading: localIsLoading } = useProducts({ PageSize: 20 });
  const finalProductsData = sharedProductsData || productsData;
  const finalIsLoading = isLoading !== undefined ? isLoading : localIsLoading;

  // Get products with discount - increase to 20 for 2 rows
  const saleProducts = finalProductsData?.items?.filter(
    (p: any) => p.originalPrice && p.originalPrice > p.price
  ).slice(0, 20) || [];

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const scroll = (dir: "left" | "right") => {
    const scrollAmount = dir === "left" ? -300 : 300;
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
    if (scrollRef2.current) {
      scrollRef2.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Show skeleton while loading
  if (isLoading) {
    return (
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-6">
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
          <div className="lg:w-1/3 bg-white rounded-xl border p-4 md:p-6">
            <div className="h-8 bg-gray-200 rounded mb-4"></div>
            <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
          <div className="lg:w-2/3 bg-linear-to-r from-emerald-500 to-lime-400 rounded-xl p-4 md:p-6">
            <div className="h-8 bg-white/20 rounded mb-4"></div>
            <div className="space-y-4">
              {/* First Row Skeleton */}
              <div className="flex gap-4 overflow-x-auto">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="shrink-0 w-[200px] bg-white rounded-lg p-3">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
              {/* Second Row Skeleton - Hidden on mobile, visible on desktop */}
              <div className="hidden lg:flex gap-4 overflow-x-auto">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="shrink-0 w-[200px] bg-white rounded-lg p-3">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
  
  // Only hide if no sale products after loading
  if (saleProducts.length === 0) return null;

  return (
    <section className="container mx-auto px-3 md:px-4 py-4 md:py-6">
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
        {/* Deal of the day */}
        <div className="lg:w-1/3 bg-white rounded-xl border p-4 md:p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">CHỈ CÓ TRONG HÔM NAY</h3>
          {saleProducts[0] && (
            <>
              <div className="relative aspect-square mb-4 overflow-hidden rounded-lg group">
                {saleProducts[0].primaryImageUrl?.includes("cloudinary") ? (
                  <img src={saleProducts[0].primaryImageUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Image src={saleProducts[0].primaryImageUrl || ""} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain" />
                )}
                {saleProducts[0].originalPrice && (
                  <span className="absolute top-2 right-2 bg-emerald-500 text-white text-sm font-bold px-2 py-1 rounded shadow-lg">
                    -{Math.round((1 - saleProducts[0].price / saleProducts[0].originalPrice) * 100)}%
                  </span>
                )}
              </div>
              <h4 className="font-medium text-gray-900 line-clamp-2 mb-2">{saleProducts[0].name}</h4>
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= (saleProducts[0].averageRating || 5) ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`} />
                ))}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-red-600">{formatCurrency(saleProducts[0].price)}</span>
                {saleProducts[0].originalPrice && (
                  <span className="text-sm text-gray-400 line-through">{formatCurrency(saleProducts[0].originalPrice)}</span>
                )}
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Đặt mua ngay! Ưu đãi sẽ kết thúc sau:</p>
                <div className="flex gap-2">
                  <div className="bg-gray-100 rounded px-4 py-3 text-center border border-gray-200">
                    <span className="text-2xl font-bold text-black">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">GIỜ</p>
                  </div>
                  <div className="bg-gray-100 rounded px-4 py-3 text-center border border-gray-200">
                    <span className="text-2xl font-bold text-black">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">PHÚT</p>
                  </div>
                  <div className="bg-gray-100 rounded px-4 py-3 text-center border border-gray-200">
                    <span className="text-2xl font-bold text-black">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">GIÂY</p>
                  </div>
                </div>
              </div>
              <Link href={getProductUrl(saleProducts[0])}>
                <Button className="w-full hover:shadow-lg hover:bg-emerald-600">
                  CHỌN MUA
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Flash Sale Products */}
        <div className="lg:w-2/3 bg-linear-to-r from-emerald-500 to-lime-400 rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
              <span className="text-yellow-300">⚡</span> FLASH SALE GIÁ SỐC
            </h3>
            <div className="flex gap-2">
          <button onClick={() => scroll("left")} className="bg-white/20 hover:bg-white/40 rounded-full p-2">
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <button onClick={() => scroll("right")} className="bg-white/20 hover:bg-white/40 rounded-full p-2">
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* First Row */}
            <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: "none" }}>
              {saleProducts.slice(1, 9).map((product: any, index: number) => (
                <Link 
                  key={product.id} 
                  href={getProductUrl(product)} 
                  className="shrink-0 w-[200px]"
                >
                  <Card className="bg-white hover:shadow-xl group">
                    <CardContent className="p-3">
                      <div className="relative aspect-square mb-2 overflow-hidden rounded-lg">
                        {product.primaryImageUrl?.includes("cloudinary") ? (
                          <img src={product.primaryImageUrl} alt="" className="w-full h-full object-contain" />
                        ) : product.primaryImageUrl ? (
                          <Image src={product.primaryImageUrl} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain" />
                        ) : (
                          <div className="w-full h-full bg-gray-100" />
                        )}
                        {product.originalPrice && (
                          <span className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-md">
                            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-bold">{formatCurrency(product.price)}</span>
                      </div>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                      )}
                      <div className="flex mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-3 w-3 ${s <= (product.averageRating || 5) ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            
            {/* Second Row - Hidden on mobile, visible on desktop */}
            <div ref={scrollRef2} className="hidden lg:flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: "none" }}>
              {saleProducts.slice(9).map((product: any, index: number) => (
                <Link 
                  key={product.id} 
                  href={getProductUrl(product)} 
                  className="shrink-0 w-[200px]"
                >
                  <Card className="bg-white hover:shadow-xl group">
                    <CardContent className="p-3">
                      <div className="relative aspect-square mb-2 overflow-hidden rounded-lg">
                        {product.primaryImageUrl?.includes("cloudinary") ? (
                          <img src={product.primaryImageUrl} alt="" className="w-full h-full object-contain" />
                        ) : product.primaryImageUrl ? (
                          <Image src={product.primaryImageUrl} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-contain" />
                        ) : (
                          <div className="w-full h-full bg-gray-100" />
                        )}
                        {product.originalPrice && (
                          <span className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded shadow-md">
                            -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-red-600 font-bold">{formatCurrency(product.price)}</span>
                      </div>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">{formatCurrency(product.originalPrice)}</span>
                      )}
                      <div className="flex mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`h-3 w-3 ${s <= (product.averageRating || 5) ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewProductsSection({ 
  sharedProductsData, 
  isLoading 
}: { 
  sharedProductsData?: any;
  isLoading?: boolean;
}) {
  // Use shared data if provided, otherwise fetch independently
  const { data: productsData, isLoading: localIsLoading } = useProducts({ PageSize: 50 });
  const finalProductsData = sharedProductsData || productsData;
  const finalIsLoading = isLoading !== undefined ? isLoading : localIsLoading;
  
  // Sort products by createdAt (newest first) or by id (larger id = newer)
  const sortedProducts = useMemo(() => {
    const items = finalProductsData?.items || [];
    return [...items].sort((a: any, b: any) => {
      // Sort by createdAt if available (newest first)
      if (a.createdAt && b.createdAt) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // Fallback: sort by id (larger id = newer, assuming auto-increment)
      return (b.id || '').localeCompare(a.id || '');
    }).slice(0, 8);
  }, [finalProductsData?.items]);
  
  const products = sortedProducts;

  if (finalIsLoading) {
    return (
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-6 w-24 bg-gray-200 rounded"></div>
        </div>
        <ProductGridSkeleton count={8} />
      </section>
    );
  }
  
  // Show section even if no products, but with message
  if (products.length === 0) {
    return (
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">SẢN PHẨM MỚI</h2>
          <Link href="/products" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-gray-500 text-center py-8">Chưa có sản phẩm mới.</p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">SẢN PHẨM MỚI</h2>
        <Link href="/products" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
          Xem tất cả <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-4">
        {/* Left Banner */}
        <div className="hidden lg:block w-1/4">
          <div className="relative h-full rounded-xl overflow-hidden">
            <Image src={banner10} alt="New Products" fill sizes="(max-width: 1024px) 0vw, 25vw" className="object-cover" />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryProductsSection({ 
  sharedCategories, 
  isLoadingCategories 
}: { 
  sharedCategories?: any;
  isLoadingCategories?: boolean;
}) {
  // Use shared categories if provided, otherwise fetch independently
  const { data: categories, isLoading: localIsLoadingCategories } = useCategories();
  const { data: categoryTree } = useCategoryTree();
  const finalCategories = sharedCategories || categories;
  const finalIsLoadingCategories = isLoadingCategories !== undefined ? isLoadingCategories : localIsLoadingCategories;

  // Category configurations with banner images
  const categoryConfigs = [
    { 
      name: "VỢT PICKLEBALL", 
      searchKey: "vợt",
      exactName: "vợt pickleball", // Try exact match first
      banner: banner7,
      bannerText: { 
        badge: "NEW ARRIVAL",
        title: "SYPIK TRITON 5",
        subtitle: "DESIGN BY VIETNAM"
      }
    },
    { 
      name: "GIÀY PICKLEBALL", 
      searchKey: "giày",
      exactName: "giày pickleball", // Try exact match first
      banner: banner8,
      bannerText: {
        badge: "15% OFF",
        title: "PICKLEBALL SHOES",
        subtitle: "PRE-ORDER NOW"
      }
    },
    { 
      name: "PHỤ KIỆN PICKLEBALL", 
      searchKey: "phụ kiện",
      exactName: "phụ kiện pickleball",
      banner: banner9,
      bannerText: {
        badge: "NEW PRODUCT",
        title: "TITANIUM EXCEED",
        subtitle: "SALE NOW"
      }
    },
    { 
      name: "BÓNG PICKLEBALL", 
      searchKey: "bóng",
      exactName: "bóng pickleball",
      banner: banner12,
      bannerText: {
        badge: "HOT",
        title: "PICKLEBALL BALLS",
        subtitle: "OFFICIAL BALLS"
      }
    }
  ];

  // Show skeleton while loading categories
  if (finalIsLoadingCategories) {
    return (
      <>
        {categoryConfigs.map((config) => (
          <section key={config.name} className="container mx-auto px-3 md:px-4 py-4 md:py-8">
            <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>
            <div className="flex gap-4">
              <div className="hidden lg:block w-1/4 h-[600px] bg-gray-200 rounded-xl"></div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-white rounded-lg p-3">
                    <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </>
    );
  }

  // Helper: match category name by searchKey / exactName
  const matchCategoryName = (name: string, searchKey: string, exactName?: string): boolean => {
    if (!name) return false;
    const n = name.toLowerCase();
    const searchKeyLower = searchKey.toLowerCase();
    const exactNameLower = exactName?.toLowerCase();
    if (exactNameLower && (n === exactNameLower || n.includes(exactNameLower))) return true;
    if (exactNameLower) {
      const words = exactNameLower.split(/\s+/).filter((w) => w.length > 0);
      if (words.every((word) => n.includes(word))) return true;
    }
    if (n === searchKeyLower || n.includes(searchKeyLower)) return true;
    return false;
  };

  // Find category: prefer flat list first (stable as soon as categories load), then tree
  const findCategoryInTree = (searchKey: string, exactName?: string): { id: string; name: string | null } | null => {
    // 1) Prefer flat categories when available so sections don't depend on categoryTree load order
    if (finalCategories && finalCategories.length > 0) {
      const flatCategory = finalCategories.find((c: any) =>
        matchCategoryName(c.name || "", searchKey, exactName)
      );
      if (flatCategory?.id) {
        return { id: flatCategory.id, name: flatCategory.name };
      }
    }

    // 2) Fallback: search in category tree (may load later)
    if (!categoryTree || categoryTree.length === 0) return null;

    const searchInParents = (cats: any[]): { id: string; name: string | null } | null => {
      for (const cat of cats) {
        if (matchCategoryName(cat.name || "", searchKey, exactName)) {
          return { id: cat.id || "", name: cat.name };
        }
      }
      return null;
    };
    const searchInChildren = (cats: any[]): { id: string; name: string | null } | null => {
      for (const cat of cats) {
        if (cat.children?.length) {
          for (const child of cat.children) {
            if (matchCategoryName(child.name || "", searchKey, exactName)) {
              return { id: child.id || "", name: child.name };
            }
            const found = searchInChildren(child.children?.length ? [child] : []);
            if (found) return found;
          }
        }
      }
      return null;
    };

    const parentMatch = searchInParents(categoryTree);
    if (parentMatch) return parentMatch;
    return searchInChildren(categoryTree);
  };

  return (
    <>
      {categoryConfigs.map((config) => {
        // First try to find in category tree (includes children)
        // Use exactName if available for better matching
        let category = findCategoryInTree(
          config.searchKey, 
          (config as any).exactName
        );
        
        // If not found in tree, try flat categories as fallback
        if (!category && finalCategories) {
          const flatCategory = finalCategories.find((c: any) => {
            const name = c.name?.toLowerCase() || "";
            const exactNameLower = (config as any).exactName?.toLowerCase();
            const searchKeyLower = config.searchKey.toLowerCase();
            
            // Priority: exact match > contains exactName > contains searchKey
            if (exactNameLower) {
              if (name === exactNameLower) return true;
              if (name.includes(exactNameLower)) return true;
            }
            if (name === searchKeyLower) return true;
            if (name.includes(searchKeyLower)) return true;
            
            return false;
          });
          if (flatCategory) {
            category = { id: flatCategory.id, name: flatCategory.name };
          }
        }
        
        // Debug: Log if category not found
        if (!category && process.env.NODE_ENV === 'development') {
          console.log(`Category not found for: ${config.name} (searchKey: ${config.searchKey}, exactName: ${(config as any).exactName})`);
        }

        // Render section even if category not found, but with loading state
        if (!category) {
          return (
            <CategoryProductSection 
              key={config.name}
              config={config}
              category={null}
            />
          );
        }

        return (
          <CategoryProductSection 
            key={config.name}
            config={config}
            category={category}
          />
        );
      })}
    </>
  );
}

function CategoryProductSection({ 
  config, 
  category
}: { 
  config: {
    name: string;
    searchKey: string;
    banner: any;
    bannerText: {
      badge: string;
      title: string;
      subtitle: string;
    };
  };
  category: { id: string; name: string | null } | null;
}) {
  const { data: categoryTree } = useCategoryTree();
  
  // Find all child category IDs if this is a parent category
  const allCategoryIds = useMemo(() => {
    if (!category?.id || !categoryTree) return [category?.id].filter(Boolean);
    
    const findCategoryInTree = (cats: any[]): any | null => {
      for (const cat of cats) {
        if (cat.id === category.id) {
          return cat;
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategoryInTree(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const foundCategory = findCategoryInTree(categoryTree);
    if (!foundCategory) return [category.id];
    
    // If category has children, collect all child IDs
    const childIds: string[] = [];
    const collectChildIds = (cat: any) => {
      if (cat.children && cat.children.length > 0) {
        cat.children.forEach((child: any) => {
          if (child.id) {
            childIds.push(child.id);
          }
          collectChildIds(child);
        });
      }
    };
    
    collectChildIds(foundCategory);
    
    // Return parent ID + all child IDs
    return [category.id, ...childIds];
  }, [category?.id, categoryTree]);

  // Fetch products from parent category first
  const { data: parentProductsData, isLoading: isLoadingParent } = useProducts({ 
    PageSize: 8,
    CategoryId: category?.id 
  });

  // If parent has children, fetch from each child category (with error handling for backend 500s)
  const childQueries = useQueries({
    queries: allCategoryIds.length > 1
      ? allCategoryIds.slice(1).map((childId) => ({
          queryKey: ["products", { PageSize: 8, CategoryId: childId }],
          queryFn: async () => {
            try {
              return await apiClient.getProducts({ PageSize: 8, CategoryId: childId });
            } catch (error: any) {
              if (error?.status === 500) {
                if (process.env.NODE_ENV === "development") {
                  console.warn(`[CategoryProductSection] Failed to fetch products for category ${childId}:`, error);
                }
                return { items: [], totalCount: 0, page: 1, pageSize: 8, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
              }
              throw error;
            }
          },
          staleTime: 15 * 60 * 1000,
          retry: false,
        }))
      : [],
  });

  // Combine products from parent and successful child queries only
  const displayProducts = useMemo(() => {
    const products: any[] = [];

    if (parentProductsData?.items) {
      products.push(...parentProductsData.items);
    }

    childQueries.forEach((query) => {
      if (query.isSuccess && query.data?.items) {
        products.push(...query.data.items);
      }
    });

    const uniqueProducts = Array.from(
      new Map(products.map((p) => [p.id, p])).values()
    ).slice(0, 8);

    return uniqueProducts;
  }, [parentProductsData?.items, childQueries]);

  // Only show loading if parent is loading, or no parent data yet and some child queries still loading
  const isLoading = isLoadingParent || (
    !parentProductsData?.items?.length &&
    childQueries.some((q) => q.isLoading)
  );

  // Show skeleton while loading
  if (isLoading) {
    return (
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-6 w-24 bg-gray-200 rounded"></div>
        </div>
        <div className="flex gap-4">
          <div className="hidden lg:block w-1/4 h-[600px] bg-gray-200 rounded-xl"></div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-lg p-3">
                <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // If no category found, show section with message
  if (!category) {
    return (
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{config.name}</h2>
          <Link href="/products" className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-gray-500 text-center py-8">Đang tải sản phẩm...</p>
      </section>
    );
  }

  // Show section even if no products, but with message
  if (displayProducts.length === 0) {
    return (
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{config.name}</h2>
          <Link 
            href={`/products${category ? `?categoryId=${category.id}` : ""}`} 
            className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <p className="text-gray-500 text-center py-8">Chưa có sản phẩm trong danh mục này.</p>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{config.name}</h2>
        <Link 
          href={`/products${category ? `?categoryId=${category.id}` : ""}`} 
          className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
        >
          Xem tất cả <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex gap-4">
        {/* Side Banner - Dark themed like reference images */}
        <div className="hidden lg:block w-1/4">
          <div className="relative h-full min-h-[600px] rounded-xl overflow-hidden bg-gray-900">
            <Image 
              src={config.banner} 
              alt={config.name} 
              fill 
              sizes="(max-width: 1024px) 0vw, 25vw"
              className="object-cover" 
            />
            {/* Overlay content */}
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30 flex flex-col justify-between p-6">
              <div>
                {config.bannerText.badge && (
                  <span className="inline-block bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded mb-4">
                    {config.bannerText.badge}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{config.bannerText.title}</h3>
                      <p className="text-emerald-400 text-sm font-medium mb-4">{config.bannerText.subtitle}</p>
                <Link href={`/products${category ? `?categoryId=${category.id}` : ""}`}>
                        <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
                          MUA NGAY
                        </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid - 2 rows x 4 columns */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayProducts.map((product: any) => (
            <Link 
              key={product.id} 
              href={getProductUrl(product)} 
              className="group"
            >
              <Card className="bg-white hover:shadow-lg h-full">
                <CardContent className="p-3">
                  <div className="relative aspect-square mb-3 bg-gray-50 rounded-lg overflow-hidden">
                    {product.primaryImageUrl?.includes("cloudinary") ? (
                      <img 
                        src={product.primaryImageUrl} 
                        alt={product.name || ""} 
                        className="w-full h-full object-contain" 
                      />
                    ) : product.primaryImageUrl ? (
                      <Image 
                        src={product.primaryImageUrl} 
                        alt={product.name || ""} 
                        fill 
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                    {/* Discount Badge */}
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">
                        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-emerald-600">
                    {product.name}
                  </h4>
                  {/* Star Rating */}
                        <div className="flex mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`h-4 w-4 ${
                                s <= (product.averageRating || 5) 
                                  ? "fill-yellow-500 text-yellow-500" 
                                  : "text-gray-300"
                              }`} 
                            />
                          ))}
                        </div>
                  {/* Price */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-red-600 font-bold">{formatCurrency(product.price)}</span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="text-gray-400 text-sm line-through">
                        {formatCurrency(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrendingSection({ 
  sharedProductsData, 
  isLoading 
}: { 
  sharedProductsData?: any;
  isLoading?: boolean;
}) {
  // Use shared data if provided, otherwise fetch independently
  const { data: productsData, isLoading: localIsLoading } = useProducts({ PageSize: 50 });
  const finalProductsData = sharedProductsData || productsData;
  const finalIsLoading = isLoading !== undefined ? isLoading : localIsLoading;
  
  const trendingProducts = [...(finalProductsData?.items || [])]
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 6);

  const viewedProducts = [...(finalProductsData?.items || [])]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 6);

  const boughtProducts = [...(finalProductsData?.items || [])]
    .filter(p => p.originalPrice && p.originalPrice > p.price)
    .slice(0, 6);

  // Show skeleton while loading
  if (finalIsLoading) {
    return (
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-6 w-32 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="flex gap-3">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Show section even if no products
  if (!finalProductsData?.items?.length) {
    return (
      <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">ĐANG TRENDING</h3>
            <p className="text-gray-500 text-sm">Chưa có sản phẩm.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">MỌI NGƯỜI ĐANG XEM</h3>
            <p className="text-gray-500 text-sm">Chưa có sản phẩm.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">MỌI NGƯỜI ĐANG MUA</h3>
            <p className="text-gray-500 text-sm">Chưa có sản phẩm.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {/* Trending */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">ĐANG TRENDING</h3>
          <div className="space-y-4">
            {trendingProducts.map((product) => (
              <Link 
                key={product.id} 
                href={getProductUrl(product)} 
                className="flex gap-3 group"
              >
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {product.primaryImageUrl?.includes("cloudinary") ? (
                    <img src={product.primaryImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : product.primaryImageUrl ? (
                    <Image src={product.primaryImageUrl} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                  ) : null}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1 rounded shadow-md">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-emerald-600">{product.name}</h4>
                  <div className="flex mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${s <= (product.averageRating || 5) ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-red-600 font-bold text-sm mt-1">{formatCurrency(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Most Viewed */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">MỌI NGƯỜI ĐANG XEM</h3>
          <div className="space-y-4">
            {viewedProducts.map((product) => (
              <Link 
                key={product.id} 
                href={getProductUrl(product)} 
                className="flex gap-3 group"
              >
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {product.primaryImageUrl?.includes("cloudinary") ? (
                    <img src={product.primaryImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : product.primaryImageUrl ? (
                    <Image src={product.primaryImageUrl} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-emerald-600">{product.name}</h4>
                  <div className="flex mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${s <= (product.averageRating || 5) ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <p className="text-red-600 font-bold text-sm mt-1">{formatCurrency(product.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Most Bought */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">MỌI NGƯỜI ĐANG MUA</h3>
          <div className="space-y-4">
            {boughtProducts.map((product) => (
              <Link 
                key={product.id} 
                href={getProductUrl(product)} 
                className="flex gap-3 group"
              >
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {product.primaryImageUrl?.includes("cloudinary") ? (
                    <img src={product.primaryImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : product.primaryImageUrl ? (
                    <Image src={product.primaryImageUrl} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                  ) : null}
                  {product.originalPrice && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1 rounded">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-emerald-600">{product.name}</h4>
                  <div className="flex mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${s <= (product.averageRating || 5) ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-red-600 font-bold text-sm">{formatCurrency(product.price)}</span>
                    {product.originalPrice && (
                      <span className="text-gray-400 text-xs line-through">{formatCurrency(product.originalPrice)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryLinksGrid({ 
  sharedCategories, 
  isLoading 
}: { 
  sharedCategories?: any;
  isLoading?: boolean;
} = {} as { sharedCategories?: any; isLoading?: boolean }) {
  // Use category tree to get root categories
  const { data: categoryTree, isLoading: localIsLoading } = useCategoryTree();
  const finalIsLoading = isLoading !== undefined ? isLoading : localIsLoading;

  // Get root categories (top-level categories only)
  const rootCategories = useMemo(() => {
    if (!categoryTree || !Array.isArray(categoryTree)) return [];
    // Root categories are the top-level categories in the tree
    return categoryTree.filter((cat: any) => cat && cat.id && cat.name);
  }, [categoryTree]);

  // Show skeleton while loading
  if (finalIsLoading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border rounded-xl p-4">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Show section even if no categories
  if (!rootCategories?.length) {
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <div className="bg-white border rounded-xl p-4 text-center">
            <p className="text-gray-500">Chưa có danh mục</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {rootCategories.slice(0, 5).map((category: any) => (
          <Link
            key={category.id}
            href={`/products?categoryId=${category.id}`}
            className="bg-white border rounded-xl p-4 hover:shadow-lg hover:border-emerald-300 group"
          >
            <div className="text-center">
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600">{category.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{category.productCount || 0} sản phẩm</p>
            </div>
          </Link>
        ))}
        <Link
          href="/products"
          className="bg-linear-to-br from-emerald-500 to-lime-400 rounded-xl p-4 flex items-center justify-center hover:shadow-lg"
        >
          <span className="text-white font-bold text-lg">Xem tất cả</span>
        </Link>
      </div>
    </section>
  );
}

function LatestNewsSection() {
  const { data: newsData, isLoading } = useNews({
    Page: 1,
    PageSize: 6,
    SortBy: "newest",
  });

  if (isLoading) {
    return (
      <section className="container mx-auto px-3 md:px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
          <div className="lg:col-span-1 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-20 h-20 bg-gray-200 rounded shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!newsData?.items || newsData.items.length === 0) {
    return null;
  }

  const featuredArticle = newsData.items[0];
  const smallArticles = newsData.items.slice(1, 6);

  return (
    <section className="container mx-auto px-3 md:px-4 py-8 md:py-12">
      {/* Section Title */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-black mb-1 md:mb-2">TIN TỨC MỚI</h2>
        <div className="h-1 w-16 md:w-20 bg-brand-green-500 rounded"></div>
      </div>

      {/* Main Content: Featured + Small Articles - 2 Equal Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Featured Article - Left Column (50% width) */}
        <div>
          <Link href={`/news/${featuredArticle.slug}`} className="block group h-full">
            <div className="flex flex-col h-full">
              {/* Image */}
              <div className="relative w-full aspect-4/3 rounded-lg overflow-hidden mb-4">
                {featuredArticle.thumbnailUrl.includes("cloudinary.com") ||
                featuredArticle.thumbnailUrl.startsWith("http") ? (
                  <img
                    src={featuredArticle.thumbnailUrl}
                    alt={featuredArticle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <Image
                    src={featuredArticle.thumbnailUrl}
                    alt={featuredArticle.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                )}
              </div>

              {/* Article Details Below */}
              <div className="flex-1">
                <h4 className="text-lg font-bold text-brand-green-500 mb-2 group-hover:text-brand-green-600 transition-colors">
                  {featuredArticle.title}
                </h4>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDate(featuredArticle.publishedAt || featuredArticle.createdAt)}
                  </span>
                </div>
                {featuredArticle.summary && (
                  <p className="text-gray-600 line-clamp-4">
                    {featuredArticle.summary}
                  </p>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Small Articles - Right Column (50% width) */}
        <div className="flex flex-col justify-between space-y-3">
          {smallArticles.map((article) => (
            <Link
              key={article.id}
              href={`/news/${article.slug}`}
              className="block group"
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="relative w-24 h-20 shrink-0 rounded overflow-hidden">
                  {article.thumbnailUrl.includes("cloudinary.com") ||
                  article.thumbnailUrl.startsWith("http") ? (
                    <img
                      src={article.thumbnailUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Image
                      src={article.thumbnailUrl}
                      alt={article.title}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="mb-1">
                    <span className="px-2 py-0.5 bg-brand-green-100 text-brand-green-800 rounded-full text-[10px] font-medium uppercase">
                      {article.category}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-black mb-1 group-hover:text-brand-green-500 transition-colors line-clamp-2">
                    {article.title}
                  </h5>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDate(article.publishedAt || article.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* View More Link */}
      <div className="text-center">
        <Link
          href="/news"
          className="inline-flex flex-col items-center gap-1 text-black hover:text-brand-green-500 transition-colors group"
        >
          <span className="text-sm font-medium">Xem thêm</span>
          <ChevronDown className="h-4 w-4 group-hover:translate-y-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");

  return (
    <section className="bg-gray-50 py-8 md:py-12">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
            <div className="flex items-center gap-3 cursor-pointer group">
              <Phone className="h-8 w-8 text-emerald-600 group-hover:text-emerald-700 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Hotline</p>
                <p className="text-emerald-600 font-bold group-hover:text-emerald-700">0824.01.01.88</p>
              </div>
            </div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <Mail className="h-8 w-8 text-emerald-600 group-hover:text-emerald-700 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Email</p>
                <p className="text-emerald-600 group-hover:text-emerald-700">support@ikasport.com</p>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex-1 w-full md:max-w-xl">
            <h3 className="font-bold text-gray-900 mb-2 text-left">Đăng ký nhận thông tin</h3>
            <p className="text-sm text-gray-600 mb-3 text-left">
              Nhận các chương trình khuyến mãi, thông báo sản phẩm mới và các ưu đãi khác.
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Nhập Email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 md:px-6 hover:shadow-lg shrink-0 whitespace-nowrap"
                onClick={() => {
                  if (email) {
                    toast.success("Đăng ký thành công!");
                    setEmail("");
                  }
                }}
              >
                ĐĂNG KÝ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBadges() {
  const badges = [
    { icon: ShieldCheck, title: "HOÀN TIỀN", desc: "Hoàn tiền 100% nếu phát hiện hàng giả" },
    { icon: Truck, title: "GIAO HÀNG TOÀN QUỐC", desc: "Miễn phí với đơn hàng từ 1 triệu đồng" },
    { icon: Clock, title: "TƯ VẤN 24/7", desc: "Đội ngũ tư vấn có chuyên môn và hiểu biết" },
  ];

  return (
    <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-6">
        {badges.map((badge) => (
          <div 
            key={badge.title} 
            className="flex items-center gap-4 md:justify-center justify-start cursor-pointer group hover:shadow-lg rounded-lg p-4"
          >
            <badge.icon className="h-12 w-12 text-emerald-600 group-hover:text-emerald-700 shrink-0" />
            <div className="text-left md:text-center">
              <h4 className="font-bold text-gray-900">{badge.title}</h4>
              <p className="text-sm text-gray-600">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
