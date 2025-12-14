"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useNews, useNewsCategories } from "@/lib/api/hooks";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, Eye, ChevronRight } from "lucide-react";
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-48" />
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
      className="mb-12 animate-fade-in" 
      style={{ 
        animationDelay: `${0.2 + index * 0.15}s`,
        opacity: 0 
      }}
    >
      {/* Category Heading with Green Underline and "Xem thêm" link */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-black mb-2">
            {category.toUpperCase()}
          </h2>
          <div className="h-1 w-24 bg-brand-green-500 rounded"></div>
        </div>
        <Link
          href={`/news/category/${categorySlug}`}
          className="flex items-center gap-1 text-brand-green-500 hover:text-brand-green-600 transition-colors font-medium"
        >
          <span>Xem thêm</span>
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* News Layout: 1 Large + 4 Small (2x2) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Featured Article - Left (2/3 width) */}
        {featuredArticle && (
          <Link
            href={`/news/${featuredArticle.slug}`}
            className={`lg:col-span-2 group ${shouldAnimate ? 'animate-fade-in' : ''}`}
            style={shouldAnimate ? {
              animationDelay: "0.1s",
              opacity: 0,
            } : {}}
          >
            <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-full">
              {/* Large Green Background Block with Title */}
              <div className="relative bg-gradient-to-br from-brand-green-400 to-brand-green-500 p-6 md:p-8 min-h-[250px] flex items-center">
                <div className="flex-1 z-10 pr-4">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 line-clamp-4">
                    {featuredArticle.title.toUpperCase()}
                  </h2>
                </div>
                <div className="hidden md:block w-56 h-56 ml-4 relative shrink-0">
                  {featuredArticle.thumbnailUrl.includes("cloudinary.com") ||
                  featuredArticle.thumbnailUrl.startsWith("http") ? (
                    <img
                      src={featuredArticle.thumbnailUrl}
                      alt={featuredArticle.title}
                      className="w-full h-full object-cover rounded-lg shadow-lg"
                    />
                  ) : (
                    <Image
                      src={featuredArticle.thumbnailUrl}
                      alt={featuredArticle.title}
                      fill
                      className="object-cover rounded-lg shadow-lg"
                      sizes="224px"
                    />
                  )}
                </div>
              </div>

              {/* Article Details Below Green Block */}
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs">
                    {featuredArticle.category}
                  </span>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDate(
                        featuredArticle.publishedAt || featuredArticle.createdAt
                      )}
                    </span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-brand-green-500 transition-colors text-black">
                  {featuredArticle.title}
                </h3>
                {featuredArticle.summary && (
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {featuredArticle.summary}
                  </p>
                )}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{featuredArticle.authorName}</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{featuredArticle.viewCount} lượt xem</span>
                  </div>
                </div>
              </CardContent>
            </div>
          </Link>
        )}

        {/* 4 Small Articles - Right (1/3 width, 2x2 grid) */}
        <div className="lg:col-span-1 grid grid-cols-2 gap-4">
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
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                {/* Image with Green Background and Logo */}
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10 bg-brand-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="font-semibold text-[10px]">IKA Sport</span>
                  </div>
                  <div className="relative h-40 w-full bg-brand-green-50">
                    {item.thumbnailUrl.includes("cloudinary.com") ||
                    item.thumbnailUrl.startsWith("http") ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                  </div>
                </div>
                <CardContent className="p-3">
                  <h3 className="font-bold text-sm mb-2 line-clamp-2 group-hover:text-brand-green-500 transition-colors">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDate(item.publishedAt || item.createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
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
    <div className="container mx-auto px-4 py-8 bg-white min-h-screen">
      <h1 
        className={`text-4xl font-bold mb-6 ${shouldAnimateHeader ? 'animate-fade-in' : ''}`}
        style={shouldAnimateHeader ? {
          animationDelay: "0s",
          opacity: 0,
        } : {}}
      >
        Tin tức Pickleball
      </h1>

      {/* Search Bar */}
      <div 
        className={`mb-8 bg-white rounded-lg p-4 shadow-sm ${shouldAnimateHeader ? 'animate-fade-in' : ''}`}
        style={shouldAnimateHeader ? {
          animationDelay: "0.1s",
          opacity: 0,
        } : {}}
      >
        <div className="relative max-w-md">
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
