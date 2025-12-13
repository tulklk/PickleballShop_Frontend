"use client";

import { useState } from "react";
import Link from "next/link";
import { useNews, useNewsCategories } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Clock, Eye, ChevronDown } from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import Image from "next/image";

export default function NewsListPage() {
  const [filters, setFilters] = useState({
    page: 1,
    pageSize: 12,
    category: "",
    searchTerm: "",
    sortBy: "newest" as "newest" | "popular" | "oldest",
  });

  const { data: newsData, isLoading } = useNews(filters);
  const { data: categories = [] } = useNewsCategories();

  const featuredArticle = newsData?.items[0];
  const otherArticles = newsData?.items.slice(1) || [];

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-6">Tin tức Pickleball</h1>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm tin tức..."
              value={filters.searchTerm}
              onChange={(e) =>
                setFilters({ ...filters, searchTerm: e.target.value, page: 1 })
              }
              className="pl-10"
            />
          </div>
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value, page: 1 })
            }
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              setFilters({
                ...filters,
                sortBy: e.target.value as "newest" | "popular" | "oldest",
                page: 1,
              })
            }
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="newest">Mới nhất</option>
            <option value="popular">Phổ biến</option>
            <option value="oldest">Cũ nhất</option>
          </select>
        </div>
      </div>

      {/* News Layout */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 md:col-span-2" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      ) : newsData?.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Không tìm thấy tin tức nào.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Featured Article - Left Side (2/3 width) */}
            {featuredArticle && (
              <Link
                href={`/news/${featuredArticle.slug}`}
                className="lg:col-span-2 group"
              >
                <div className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow h-full">
                  {/* Featured Article with Green Background */}
                  <div className="relative bg-gradient-to-br from-lime-400 to-lime-500 p-6 md:p-8 min-h-[200px] flex items-center">
                    <div className="flex-1 z-10">
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-4 line-clamp-3">
                        {featuredArticle.title.toUpperCase()}
                      </h2>
                    </div>
                    <div className="hidden md:block w-48 h-48 ml-4 relative flex-shrink-0">
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
                          sizes="192px"
                        />
                      )}
                    </div>
                  </div>

                  {/* Article Details Below */}
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded">
                        {featuredArticle.category}
                      </span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {formatDate(
                            featuredArticle.publishedAt ||
                              featuredArticle.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-emerald-600 transition-colors">
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

            {/* Other Articles - Right Side (1/3 width, 2 columns) */}
            <div className="lg:col-span-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {otherArticles.slice(0, 4).map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`} className="group">
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                    {/* Image with Green Border/Background */}
                    <div className="relative">
                      <div className="absolute top-2 right-2 z-10 bg-lime-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <span className="font-semibold">IKA Sport</span>
                      </div>
                      <div className="relative h-40 w-full bg-lime-100">
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
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
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

          {/* More Articles Grid (if more than 5 articles) */}
          {otherArticles.length > 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {otherArticles.slice(4).map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`} className="group">
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                    <div className="relative">
                      <div className="absolute top-2 right-2 z-10 bg-lime-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <span className="font-semibold">IKA Sport</span>
                      </div>
                      <div className="relative h-48 w-full bg-lime-100">
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
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        )}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-xs">
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
                      <h3 className="font-bold text-base mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                        {item.title}
                      </h3>
                      {item.summary && (
                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                          {item.summary}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{item.authorName}</span>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{item.viewCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {/* Load More / Pagination */}
          {newsData && newsData.totalPages > 1 && (
            <div className="flex flex-col items-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ ...filters, page: filters.page + 1 })
                }
                disabled={!newsData.hasNextPage}
                className="flex items-center gap-2"
              >
                Xem thêm
                <ChevronDown className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page - 1 })
                  }
                  disabled={!newsData.hasPreviousPage}
                >
                  Trước
                </Button>
                <span>
                  Trang {newsData.page} / {newsData.totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFilters({ ...filters, page: filters.page + 1 })
                  }
                  disabled={!newsData.hasNextPage}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
