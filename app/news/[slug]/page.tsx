"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useNewsDetail, useNews } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import { NewsContent } from "@/components/news/NewsContent";
import Image from "next/image";

export default function NewsDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: news, isLoading } = useNewsDetail(slug);
  const { data: relatedNews } = useNews({
    Category: news?.category,
    PageSize: 3,
    SortBy: "popular",
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!news) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Không tìm thấy tin tức.</p>
        <Link href="/news">
          <Button className="mt-4">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <Link href="/news">
        <Button variant="outline" className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại danh sách
        </Button>
      </Link>

      {/* Thumbnail */}
      <div className="relative h-96 w-full mb-6 rounded-lg overflow-hidden">
        {news.thumbnailUrl.includes("cloudinary.com") ||
        news.thumbnailUrl.startsWith("http") ? (
          <img
            src={news.thumbnailUrl}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={news.thumbnailUrl}
            alt={news.title}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        )}
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-500">
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
          {news.category}
        </span>
        <span>{formatDate(news.publishedAt || news.createdAt)}</span>
        <span>•</span>
        <span>{news.authorName}</span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          {news.viewCount} lượt xem
        </span>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-bold mb-4">{news.title}</h1>

      {/* Summary */}
      {news.summary && (
        <p className="text-xl text-gray-600 mb-6 italic">{news.summary}</p>
      )}

      {/* Content */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <NewsContent content={news.content} />
        </CardContent>
      </Card>

      {/* Tags */}
      {news.tags && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Tags:</h3>
          <div className="flex flex-wrap gap-2">
            {news.tags.split(",").map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                #{tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related News */}
      {relatedNews && relatedNews.items.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Tin tức liên quan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedNews.items
              .filter((item) => item.id !== news.id)
              .slice(0, 3)
              .map((item) => (
                <Link key={item.id} href={`/news/${item.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="relative h-32 w-full">
                      {item.thumbnailUrl.includes("cloudinary.com") ||
                      item.thumbnailUrl.startsWith("http") ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      ) : (
                        <Image
                          src={item.thumbnailUrl}
                          alt={item.title}
                          fill
                          className="object-cover rounded-t-lg"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold line-clamp-2 hover:text-emerald-600">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-2">
                        {formatDate(item.publishedAt || item.createdAt)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
