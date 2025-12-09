"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Trophy, Zap, ChevronLeft, ChevronRight, Star, Clock, Truck, Phone, Mail } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductGridSkeleton } from "@/components/shared/ProductSkeleton";
import { useProducts, useCategories } from "@/lib/api/hooks";
import { ProductCard } from "@/components/shared/ProductCard";
import { formatCurrency } from "@/lib/utils/formatCurrency";
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

      {/* Promotion Banners */}
      <PromotionBanners />

      {/* Flash Sale Section */}
      <FlashSaleSection />

      {/* New Products Section */}
      <NewProductsSection />

      {/* Category Sections */}
      <CategoryProductsSection />

      {/* Trending & Popular Section */}
      <TrendingSection />

      {/* Category Links Grid */}
      <CategoryLinksGrid />

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
    <section className="relative">
      <div className="flex">
        {/* Main Banner */}
        <div className="relative w-full lg:w-2/3 h-[300px] md:h-[450px] overflow-hidden">
          {banners.map((banner, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-700 ${
                idx === currentSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={banner}
                alt={`Banner ${idx + 1}`}
                fill
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
                className={`w-3 h-3 rounded-full transition-colors ${
                  idx === currentSlide ? "bg-lime-400" : "bg-white/60"
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
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent flex items-end p-4">
              <Button className="bg-lime-400 text-black hover:bg-lime-500">XEM NGAY</Button>
            </div>
          </Link>
          <Link href="/products" className="relative h-[224px] overflow-hidden rounded-lg group bg-white">
            <Image
              src={banner11}
              alt="JOOLA Pro IV New Colorway Vietnam Edition"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 z-10">
              <Button className="bg-lime-400 text-black hover:bg-lime-500 shadow-xl px-8 py-2.5 text-sm font-bold tracking-wide transition-all duration-300 hover:scale-105">
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
            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
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
              <Button className="bg-white text-black hover:bg-emerald-500 hover:text-white px-6 font-semibold">
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
            className="object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          />
          <div className="absolute inset-0 bg-black/70 flex flex-col justify-between p-6">
            <div className="space-y-1">
              <p className="text-xs font-semibold tracking-[0.2em] text-lime-400">
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

function PromotionBanners() {
  return (
    <section className="container mx-auto px-3 md:px-4 py-4 md:py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* Banner 1 - Trao đổi vợt cũ */}
        <div className="bg-linear-to-r from-amber-50 to-amber-100 rounded-xl p-6 md:p-8 flex items-center justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-amber-200/50">
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">TRAO ĐỔI VỢT CŨ</h3>
            <p className="text-sm font-semibold text-emerald-600 mb-3">TIẾT KIỆM NHẤT</p>
            <div className="flex flex-wrap gap-2 md:gap-3 text-xs text-gray-600">
              <span className="px-2 py-1 bg-white/50 rounded">ĐỔI MỚI</span>
              <span className="px-2 py-1 bg-white/50 rounded">KÍ GỬI</span>
              <span className="px-2 py-1 bg-white/50 rounded">ĐỔI CÂY CŨ KHÁC</span>
            </div>
          </div>
          <div className="text-right ml-4 shrink-0">
            <p className="text-xs text-gray-500 mb-1">CHI PHÍ</p>
            <p className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-none">THẤP</p>
          </div>
        </div>

        {/* Banner 2 - Thay đế giày */}
        <div className="bg-linear-to-r from-orange-50 to-orange-100 rounded-xl p-6 md:p-8 flex items-center justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-orange-200/50">
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">THAY ĐẾ GIÀY PICKLEBALL</h3>
            <p className="text-sm text-gray-700 mb-3">GIỮ NGUYÊN CẤU TRÚC</p>
            <div className="flex flex-wrap gap-2 md:gap-3 text-xs text-gray-600">
              <span className="px-2 py-1 bg-white/50 rounded">ASICS</span>
              <span className="px-2 py-1 bg-white/50 rounded">NIKE</span>
              <span className="px-2 py-1 bg-white/50 rounded">ADIDAS...</span>
            </div>
          </div>
          <div className="text-right ml-4 shrink-0">
            <p className="text-xs text-gray-500 mb-1">CHUẨN</p>
            <p className="text-4xl md:text-5xl font-extrabold text-emerald-600 leading-none">100%</p>
          </div>
        </div>

        {/* Banner 3 - Sửa vợt */}
        <div className="bg-linear-to-r from-lime-50 to-lime-100 rounded-xl p-6 md:p-8 flex items-center justify-between hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-lime-200/50">
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">SỬA VỢT PICKLEBALL</h3>
            <p className="text-sm text-gray-700 mb-3">CHI PHÍ THẤP NHẤT</p>
            <div className="flex flex-wrap gap-2 md:gap-3 text-xs text-gray-600">
              <span className="px-2 py-1 bg-white/50 rounded">KHÔNG LỆCH</span>
              <span className="px-2 py-1 bg-white/50 rounded">THẨM MỸ CAO</span>
              <span className="px-2 py-1 bg-white/50 rounded">BẢO HÀNH</span>
            </div>
          </div>
          <div className="text-right ml-4 shrink-0">
            <p className="text-xs text-gray-500 mb-1">KHÔI PHỤC</p>
            <p className="text-4xl md:text-5xl font-extrabold text-lime-600 leading-none">99%</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FlashSaleSection() {
  const [timeLeft, setTimeLeft] = useState({ hours: 22, minutes: 37, seconds: 39 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: productsData, isLoading } = useProducts({ PageSize: 20 });

  // Get products with discount
  const saleProducts = productsData?.items?.filter(
    (p) => p.originalPrice && p.originalPrice > p.price
  ).slice(0, 10) || [];

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
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
    }
  };

  if (isLoading || saleProducts.length === 0) return null;

  return (
    <section className="container mx-auto px-3 md:px-4 py-4 md:py-6">
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
        {/* Deal of the day */}
        <div className="lg:w-1/3 bg-white rounded-xl border p-4 md:p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">CHỈ CÓ TRONG HÔM NAY</h3>
          {saleProducts[0] && (
            <>
              <div className="relative aspect-square mb-4">
                {saleProducts[0].primaryImageUrl?.includes("cloudinary") ? (
                  <img src={saleProducts[0].primaryImageUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <Image src={saleProducts[0].primaryImageUrl || ""} alt="" fill className="object-contain" />
                )}
                {saleProducts[0].originalPrice && (
                  <span className="absolute top-2 right-2 bg-lime-400 text-black text-sm font-bold px-2 py-1 rounded">
                    -{Math.round((1 - saleProducts[0].price / saleProducts[0].originalPrice) * 100)}%
                  </span>
                )}
              </div>
              <h4 className="font-medium text-gray-900 line-clamp-2 mb-2">{saleProducts[0].name}</h4>
              <div className="flex items-center gap-1 mb-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`h-4 w-4 ${s <= (saleProducts[0].averageRating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
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
                  <div className="bg-gray-100 rounded px-3 py-2 text-center">
                    <span className="text-2xl font-bold">{String(timeLeft.hours).padStart(2, '0')}</span>
                    <p className="text-xs text-gray-500">GIỜ</p>
                  </div>
                  <div className="bg-gray-100 rounded px-3 py-2 text-center">
                    <span className="text-2xl font-bold">{String(timeLeft.minutes).padStart(2, '0')}</span>
                    <p className="text-xs text-gray-500">PHÚT</p>
                  </div>
                  <div className="bg-gray-100 rounded px-3 py-2 text-center">
                    <span className="text-2xl font-bold">{String(timeLeft.seconds).padStart(2, '0')}</span>
                    <p className="text-xs text-gray-500">GIÂY</p>
                  </div>
                </div>
              </div>
              <Link href={getProductUrl(saleProducts[0])}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700">CHỌN MUA</Button>
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
              <button onClick={() => scroll("left")} className="bg-white/20 hover:bg-white/30 rounded-full p-2">
                <ChevronLeft className="h-5 w-5 text-white" />
              </button>
              <button onClick={() => scroll("right")} className="bg-white/20 hover:bg-white/30 rounded-full p-2">
                <ChevronRight className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex gap-4 overflow-x-auto scrollbar-hide pb-2" style={{ scrollbarWidth: "none" }}>
            {saleProducts.slice(1).map((product) => (
              <Link key={product.id} href={getProductUrl(product)} className="shrink-0 w-[200px]">
                <Card className="bg-white hover:shadow-lg transition-shadow">
                  <CardContent className="p-3">
                    <div className="relative aspect-square mb-2">
                      {product.primaryImageUrl?.includes("cloudinary") ? (
                        <img src={product.primaryImageUrl} alt="" className="w-full h-full object-contain" />
                      ) : product.primaryImageUrl ? (
                        <Image src={product.primaryImageUrl} alt="" fill className="object-contain" />
                      ) : (
                        <div className="w-full h-full bg-gray-100" />
                      )}
                      {product.originalPrice && (
                        <span className="absolute top-1 left-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
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
                        <Star key={s} className={`h-3 w-3 ${s <= (product.averageRating || 5) ? "fill-lime-400 text-lime-400" : "text-gray-300"}`} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NewProductsSection() {
  const { data: productsData, isLoading } = useProducts({ PageSize: 50 });
  const products = productsData?.items?.slice(0, 8) || [];

  if (isLoading) return <ProductGridSkeleton count={8} />;
  if (products.length === 0) return null;

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
            <Image src={banner10} alt="New Products" fill className="object-cover" />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryProductsSection() {
  const { data: categories } = useCategories();
  const { data: productsData } = useProducts({ PageSize: 100 });

  // Category configurations with banner images
  const categoryConfigs = [
    { 
      name: "VỢT PICKLEBALL", 
      searchKey: "vợt",
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
      banner: banner12,
      bannerText: {
        badge: "HOT",
        title: "PICKLEBALL BALLS",
        subtitle: "OFFICIAL BALLS"
      }
    }
  ];

  return (
    <>
      {categoryConfigs.map((config, idx) => {
        const category = categories?.find(c => 
          c.name?.toLowerCase().includes(config.searchKey.toLowerCase())
        );
        // Filter by product name/type since ProductListDto doesn't have categoryId
        const products = productsData?.items?.filter(p => 
          p.name?.toLowerCase().includes(config.searchKey.toLowerCase()) ||
          p.productType?.toLowerCase().includes(config.searchKey.toLowerCase())
        ).slice(0, 8) || [];

        // If no category products, show some products anyway
        const displayProducts = products.length > 0 
          ? products 
          : productsData?.items?.slice(idx * 8, (idx + 1) * 8) || [];

        if (displayProducts.length === 0) return null;

        return (
          <section key={config.name} className="container mx-auto px-3 md:px-4 py-4 md:py-8">
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
                    className="object-cover" 
                  />
                  {/* Overlay content */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/70 via-transparent to-black/30 flex flex-col justify-between p-6">
                    <div>
                      {config.bannerText.badge && (
                        <span className="inline-block bg-lime-400 text-black text-xs font-bold px-3 py-1 rounded mb-4">
                          {config.bannerText.badge}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">{config.bannerText.title}</h3>
                      <p className="text-lime-400 text-sm font-medium mb-4">{config.bannerText.subtitle}</p>
                      <Link href={`/products${category ? `?categoryId=${category.id}` : ""}`}>
                        <Button className="bg-lime-400 text-black hover:bg-lime-500 font-semibold">
                          MUA NGAY
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products Grid - 2 rows x 4 columns */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                {displayProducts.map((product) => (
                  <Link key={product.id} href={getProductUrl(product)} className="group">
                    <Card className="bg-white hover:shadow-lg transition-all hover:-translate-y-1 h-full">
                      <CardContent className="p-3">
                        <div className="relative aspect-square mb-3 bg-gray-50 rounded-lg overflow-hidden">
                          {product.primaryImageUrl?.includes("cloudinary") ? (
                            <img 
                              src={product.primaryImageUrl} 
                              alt={product.name || ""} 
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform" 
                            />
                          ) : product.primaryImageUrl ? (
                            <Image 
                              src={product.primaryImageUrl} 
                              alt={product.name || ""} 
                              fill 
                              className="object-contain group-hover:scale-105 transition-transform" 
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                              No image
                            </div>
                          )}
                          {/* Discount Badge */}
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                            </span>
                          )}
                          {/* Hover Button */}
                          <div className="absolute inset-x-0 bottom-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm">
                              CHỌN
                            </Button>
                          </div>
                        </div>
                        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 group-hover:text-emerald-600 transition-colors">
                          {product.name}
                        </h4>
                        {/* Star Rating */}
                        <div className="flex mb-2">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={`h-4 w-4 ${
                                s <= (product.averageRating || 5) 
                                  ? "fill-lime-400 text-lime-400" 
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
      })}
    </>
  );
}

function TrendingSection() {
  const { data: productsData } = useProducts({ PageSize: 50 });
  
  const trendingProducts = [...(productsData?.items || [])]
    .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
    .slice(0, 6);

  const viewedProducts = [...(productsData?.items || [])]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 6);

  const boughtProducts = [...(productsData?.items || [])]
    .filter(p => p.originalPrice && p.originalPrice > p.price)
    .slice(0, 6);

  if (!productsData?.items?.length) return null;

  return (
    <section className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        {/* Trending */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4">ĐANG TRENDING</h3>
          <div className="space-y-4">
            {trendingProducts.map((product) => (
              <Link key={product.id} href={getProductUrl(product)} className="flex gap-3 group">
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {product.primaryImageUrl?.includes("cloudinary") ? (
                    <img src={product.primaryImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : product.primaryImageUrl ? (
                    <Image src={product.primaryImageUrl} alt="" fill className="object-cover" />
                  ) : null}
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1 rounded">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-emerald-600">{product.name}</h4>
                  <div className="flex mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${s <= (product.averageRating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
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
              <Link key={product.id} href={getProductUrl(product)} className="flex gap-3 group">
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {product.primaryImageUrl?.includes("cloudinary") ? (
                    <img src={product.primaryImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : product.primaryImageUrl ? (
                    <Image src={product.primaryImageUrl} alt="" fill className="object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-emerald-600">{product.name}</h4>
                  <div className="flex mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`h-3 w-3 ${s <= (product.averageRating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
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
              <Link key={product.id} href={getProductUrl(product)} className="flex gap-3 group">
                <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {product.primaryImageUrl?.includes("cloudinary") ? (
                    <img src={product.primaryImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : product.primaryImageUrl ? (
                    <Image src={product.primaryImageUrl} alt="" fill className="object-cover" />
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
                      <Star key={s} className={`h-3 w-3 ${s <= (product.averageRating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
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

function CategoryLinksGrid() {
  const { data: categories } = useCategories();

  const categoryIcons: { [key: string]: string } = {
    "vợt": "🏸",
    "giày": "👟",
    "bóng": "⚽",
    "trang phục": "👕",
    "phụ kiện": "🎒",
  };

  const getIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (lowerName.includes(key)) return icon;
    }
    return "📦";
  };

  if (!categories?.length) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {categories.slice(0, 5).map((category) => (
          <Link
            key={category.id}
            href={`/products?categoryId=${category.id}`}
            className="bg-white border rounded-xl p-4 hover:shadow-lg hover:border-emerald-300 transition-all group"
          >
            <div className="text-center">
              <span className="text-4xl">{getIcon(category.name || "")}</span>
              <h3 className="font-semibold text-gray-900 mt-2 group-hover:text-emerald-600">{category.name}</h3>
              <p className="text-sm text-gray-500">{category.productCount || 0} sản phẩm</p>
            </div>
          </Link>
        ))}
        <Link
          href="/products"
          className="bg-linear-to-br from-emerald-500 to-lime-400 rounded-xl p-4 flex items-center justify-center hover:shadow-lg transition-all"
        >
          <span className="text-white font-bold text-lg">Xem tất cả</span>
        </Link>
      </div>
    </section>
  );
}

function NewsletterSection() {
  const [email, setEmail] = useState("");

  return (
    <section className="bg-gray-50 py-12">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Contact Info */}
          <div className="flex gap-8">
            <div className="flex items-center gap-3">
              <Phone className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-semibold text-gray-900">Hotline</p>
                <p className="text-emerald-600 font-bold">0824.01.01.88</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="font-semibold text-gray-900">Email</p>
                <p className="text-emerald-600">support@ikasport.com</p>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex-1 max-w-xl">
            <h3 className="font-bold text-gray-900 mb-2">Đăng ký nhận thông tin</h3>
            <p className="text-sm text-gray-600 mb-3">
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
                className="bg-gray-900 hover:bg-gray-800 text-white px-6"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {badges.map((badge) => (
          <div key={badge.title} className="flex items-center gap-4 justify-center">
            <badge.icon className="h-12 w-12 text-emerald-600" />
            <div>
              <h4 className="font-bold text-gray-900">{badge.title}</h4>
              <p className="text-sm text-gray-600">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
