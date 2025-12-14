"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useNews, useNewsCategories } from "@/lib/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import NewsSidebar from "@/components/news/NewsSidebar";
import { Pagination } from "@/components/news/Pagination";
import { FeaturedCarousel } from "@/components/news/FeaturedCarousel";
import Image from "next/image";

export default function NewsCategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const page = parseInt(searchParams.get("page") || "1", 10);

  const { data: categories = [] } = useNewsCategories();

  // Find category by slug
  const categoryName = categories.find((cat) => {
    const categorySlug = cat
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return categorySlug === slug;
  });

  // Fetch data for 3 sections
  const { data: featuredData } = useNews({
    Category: categoryName || "",
    Page: 1,
    PageSize: 5,
    SortBy: "popular",
  });

  const { data: latestData, isLoading: isLoadingLatest } = useNews({
    Category: categoryName || "",
    Page: page,
    PageSize: 10,
    SortBy: "newest",
  });

  const { data: mostViewedData, isLoading: isLoadingMostViewed } = useNews({
    Category: categoryName || "",
    Page: 1,
    PageSize: 7,
    SortBy: "popular",
  });

  if (!categoryName) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Không tìm thấy danh mục</h1>
          <Link href="/news">
            <span className="text-brand-green-500 hover:text-brand-green-600">
              Quay lại trang tin tức
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Left Sidebar */}
        <aside className="hidden lg:block shrink-0">
          <NewsSidebar activeCategory={categoryName} />
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          {/* Category Heading */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-black mb-2">
              DANH MỤC TIN TỨC {categoryName.toUpperCase()}
            </h1>
            <div className="h-1 w-24 bg-brand-green-500 rounded"></div>
          </div>

          {/* 1. Nổi bật nhất - Carousel */}
          {featuredData && featuredData.items.length > 0 && (
            <FeaturedCarousel articles={featuredData.items.slice(0, 5)} />
          )}

          {/* 2. Tin tức cập nhật & 3. Xem nhiều nhất - Side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Tin tức cập nhật - Left (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-black mb-2">TIN TỨC CẬP NHẬT</h2>
                <div className="h-1 w-24 bg-brand-green-500 rounded"></div>
              </div>

              {isLoadingLatest ? (
                <div className="space-y-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="w-32 h-32 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : latestData?.items.length === 0 ? (
                <p className="text-gray-500">Không có tin tức mới.</p>
              ) : (
                <>
                  <div className="space-y-6">
                    {latestData?.items.map((item, index) => (
                      <Link 
                        key={item.id} 
                        href={`/news/${item.slug}`} 
                        className="block group animate-fade-in"
                        style={{
                          animationDelay: `${index * 0.1}s`,
                          opacity: 0,
                        }}
                      >
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="relative w-32 h-32 shrink-0 bg-brand-green-50">
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
                                sizes="128px"
                              />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <span className="px-2 py-1 bg-brand-green-100 text-brand-green-800 rounded-full">
                                {item.category}
                              </span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatDate(item.publishedAt || item.createdAt)}
                                </span>
                              </div>
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-brand-green-500 transition-colors line-clamp-2">
                              {item.title.toUpperCase()}
                            </h3>
                            {item.summary && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {item.summary}
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Pagination for Latest News */}
                  {latestData && latestData.totalPages > 1 && (
                    <Pagination
                      currentPage={latestData.page}
                      totalPages={latestData.totalPages}
                      baseUrl={`/news/category/${slug}`}
                    />
                  )}
                </>
              )}
            </div>

            {/* Xem nhiều nhất - Right (1/3 width) */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-black mb-2">XEM NHIỀU NHẤT</h2>
                <div className="h-1 w-24 bg-brand-green-500 rounded"></div>
              </div>

              {isLoadingMostViewed ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-20 h-20 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : mostViewedData?.items.length === 0 ? (
                <p className="text-gray-500 text-sm">Không có tin tức.</p>
              ) : (
                <div className="space-y-3">
                  {mostViewedData?.items.map((item, index) => (
                    <Link 
                      key={item.id} 
                      href={`/news/${item.slug}`} 
                      className="block group animate-fade-in"
                      style={{
                        animationDelay: `${index * 0.08}s`,
                        opacity: 0,
                      }}
                    >
                      <div className="flex gap-3">
                        {/* Small Thumbnail */}
                        <div className="relative w-20 h-20 shrink-0 bg-brand-green-50">
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
                              sizes="80px"
                            />
                          )}
                        </div>
                        {/* Title Only */}
                        <div className="flex-1 flex items-center">
                          <h3 className="text-sm font-bold group-hover:text-brand-green-500 transition-colors line-clamp-2">
                            {item.title}
                          </h3>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
