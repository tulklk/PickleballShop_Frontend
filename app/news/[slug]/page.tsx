"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useNewsDetail, useNews } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Eye, Clock, Facebook, Twitter, Mail, Linkedin, Share2 } from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import { NewsContent } from "@/components/news/NewsContent";
import NewsSidebar from "@/components/news/NewsSidebar";
import { TableOfContents } from "@/components/news/TableOfContents";
import { NewsComments } from "@/components/news/NewsComments";
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        {/* Left Sidebar */}
        <aside className="hidden lg:block shrink-0">
          <NewsSidebar />
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-4xl">
          {/* Back button */}
          <Link href="/news">
            <Button variant="ghost" className="mb-6 text-gray-600 hover:text-brand-green-500">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="text-sm">{news.title}</span>
            </Button>
          </Link>

          {/* Hero Section with Green Background */}
          <div className="relative mb-6 rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Green Background with Title */}
              <div className="lg:col-span-2 bg-brand-green-500 p-6 md:p-8 min-h-[200px] flex items-center">
                <div className="flex-1 z-10">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 bg-brand-green-600 text-white rounded-full text-xs font-semibold">
                      {news.category}
                    </span>
                    {news.tags && news.tags.split(",").slice(0, 1).map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white text-gray-800 rounded-full text-xs font-semibold"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                    {news.title.toUpperCase()}
                  </h1>
                </div>
              </div>

              {/* Image on Right */}
              <div className="lg:col-span-1 relative h-64 lg:h-auto bg-white">
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
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    priority
                  />
                )}
              </div>
            </div>
          </div>

          {/* Meta info */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <span className="font-semibold">{news.authorName}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDate(news.publishedAt || news.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Summary/Introduction */}
          {news.summary && (
            <div className="mb-6 text-gray-700 leading-relaxed">
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: news.summary }}
              />
            </div>
          )}

          {/* Table of Contents */}
          <TableOfContents content={news.content} />

          {/* Content */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <NewsContent content={news.content} />
            </CardContent>
          </Card>

          {/* Social Sharing */}
          <div className="mb-8 flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Chia sẻ:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 hover:border-emerald-600 hover:text-emerald-600"
                onClick={() => {
                  const url = window.location.href;
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                    "_blank"
                  );
                }}
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 hover:border-emerald-600 hover:text-emerald-600"
                onClick={() => {
                  const url = window.location.href;
                  const text = news.title;
                  window.open(
                    `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
                    "_blank"
                  );
                }}
              >
                <Twitter className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 hover:border-emerald-600 hover:text-emerald-600"
                onClick={() => {
                  const url = window.location.href;
                  const subject = news.title;
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(url)}`;
                }}
              >
                <Mail className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 hover:border-emerald-600 hover:text-emerald-600"
                onClick={() => {
                  const url = window.location.href;
                  window.open(
                    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
                    "_blank"
                  );
                }}
              >
                <Linkedin className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Comments Section */}
          <NewsComments newsId={news.id} slug={news.slug} />

          {/* Related News */}
          {relatedNews && relatedNews.items.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6">Bài viết liên quan</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {relatedNews.items
                  .filter((item) => item.id !== news.id)
                  .slice(0, 3)
                  .map((item) => (
                    <Link key={item.id} href={`/news/${item.slug}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
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
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          )}
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-2">
                            <div className="bg-brand-green-500 text-white text-xs px-2 py-1 rounded inline-block mb-2">
                              {item.category}
                            </div>
                          </div>
                          <h3 className="font-bold text-base mb-2 line-clamp-2 hover:text-brand-green-500">
                            {item.title.toUpperCase()}
                          </h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {item.summary}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(item.publishedAt || item.createdAt)}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
