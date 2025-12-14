"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useNews, useNewsCategories } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import Image from "next/image";

// Component for each category section
function CategoryNewsSection({
  category,
  searchTerm,
  index = 0,
}: {
  category: string;
  searchTerm: string;
  index?: number;
}) {
  const { data: newsData, isLoading } = useNews({
    Category: category,
    PageSize: 5,
    SortBy: category === "Nổi bật" ? "popular" : "newest",
    SearchTerm: searchTerm || undefined,
  });

  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Only trigger animation after data is loaded
  useEffect(() => {
    if (!isLoading && newsData?.items && newsData.items.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setShouldAnimate(false);
    }
  }, [isLoading, newsData]);

  const newsItems = newsData?.items || [];
  if (newsItems.length === 0 && !isLoading) return null;

  const featuredArticle = newsItems[0];
  const smallArticles = newsItems.slice(1, 5); // Get next 4 articles

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Featured skeleton */}
          <div>
            <Skeleton className="aspect-4/3 w-full rounded-lg mb-4" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-16 w-full" />
          </div>
          {/* Small articles skeleton */}
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j}>
                <Skeleton className="aspect-4/3 w-full rounded-lg mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Create slug for category URL
  const categorySlug = category
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return (
    <div 
      className="mb-8 md:mb-12 animate-fade-in" 
      style={{ 
        animationDelay: `${0.2 + index * 0.15}s`,
        opacity: 0 
      }}
    >
      {/* Category Heading with Green Underline and "Xem thêm" link */}
      <div className="mb-4 md:mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-black mb-1 md:mb-2">
            {category.toUpperCase()}
          </h2>
          <div className="h-1 w-16 md:w-24 bg-brand-green-500 rounded"></div>
        </div>
        <Link
          href={`/news/category/${categorySlug}`}
          className="flex items-center gap-1 text-brand-green-500 hover:text-brand-green-600 transition-colors font-medium text-sm md:text-base"
        >
          <span>Xem thêm</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* News Layout: 2 Equal Columns - Featured + 4 Small (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Featured Article - Left Column (50% width) */}
        {featuredArticle && (
          <Link
            href={`/news/${featuredArticle.slug}`}
            className={`group ${shouldAnimate ? 'animate-fade-in' : ''}`}
            style={shouldAnimate ? {
              animationDelay: "0.1s",
              opacity: 0,
            } : {}}
          >
            <div className="h-full flex flex-col">
              {/* Image Only - No Green Background */}
              <div className="relative w-full aspect-video md:aspect-4/3 rounded-lg overflow-hidden mb-3 md:mb-4">
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

              {/* Article Details Below - No Card Background */}
              <div className="flex-1">
                <h3 className="text-base md:text-xl font-bold mb-2 group-hover:text-brand-green-500 transition-colors text-brand-green-500">
                  {featuredArticle.title}
                </h3>
                <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-2">
                  <Clock className="h-3 w-3 md:h-4 md:w-4" />
                  <span>
                    {formatDate(
                      featuredArticle.publishedAt || featuredArticle.createdAt
                    )}
                  </span>
                </div>
                {featuredArticle.summary && (
                  <p className="text-gray-600 line-clamp-2 md:line-clamp-3 text-sm md:text-base">
                    {featuredArticle.summary}
                  </p>
                )}
              </div>
            </div>
          </Link>
        )}

        {/* 4 Small Articles - Right Column (50% width, 2x2 grid) */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {smallArticles.map((item, itemIndex) => (
            <Link
              key={item.id}
              href={`/news/${item.slug}`}
              className={`group ${shouldAnimate ? 'animate-fade-in' : ''}`}
              style={shouldAnimate ? {
                animationDelay: `${0.3 + itemIndex * 0.1}s`,
                opacity: 0,
              } : {}}
            >
              {/* No Card Background - Direct Content */}
              <div className="h-full flex flex-col">
                {/* Image */}
                <div className="relative aspect-4/3 w-full rounded-lg overflow-hidden mb-2 md:mb-3">
                  {item.thumbnailUrl.includes("cloudinary.com") ||
                  item.thumbnailUrl.startsWith("http") ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <Image
                      src={item.thumbnailUrl}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1">
                  <h3 className="font-bold text-xs md:text-sm mb-1 md:mb-2 line-clamp-2 group-hover:text-brand-green-500 transition-colors text-black">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500">
                    <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                    <span>
                      {formatDate(item.publishedAt || item.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NewsListPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [shouldAnimateHeader, setShouldAnimateHeader] = useState(false);
  const { data: categories = [] } = useNewsCategories();

  // Trigger header animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimateHeader(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Define category order - "Nổi bật" first, then others
  const orderedCategories = useMemo(() => {
    const featured = "Nổi bật";
    const otherCategories = categories.filter((cat) => cat !== featured);
    return [featured, ...otherCategories].filter(Boolean);
  }, [categories]);

  return (
    <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 bg-white min-h-screen">
      <h1 
        className={`text-2xl md:text-4xl font-bold mb-4 md:mb-6 ${shouldAnimateHeader ? 'animate-fade-in' : ''}`}
        style={shouldAnimateHeader ? {
          animationDelay: "0s",
          opacity: 0,
        } : {}}
      >
        Tin tức Pickleball
      </h1>

      {/* Search Bar */}
      <div 
        className={`mb-6 md:mb-8 bg-white rounded-lg p-3 md:p-4 shadow-sm ${shouldAnimateHeader ? 'animate-fade-in' : ''}`}
        style={shouldAnimateHeader ? {
          animationDelay: "0.1s",
          opacity: 0,
        } : {}}
      >
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Tìm kiếm tin tức..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* News by Categories */}
      <div className="space-y-12">
        {orderedCategories.map((category, index) => (
          <CategoryNewsSection
            key={category}
            category={category}
            searchTerm={searchTerm}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
