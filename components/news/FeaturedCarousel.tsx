"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Clock, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils/formatDate";
import Image from "next/image";

interface NewsItem {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string;
  category: string;
  publishedAt?: string;
  createdAt: string;
  authorName: string;
  viewCount: number;
  summary?: string;
}

interface FeaturedCarouselProps {
  articles: NewsItem[];
}

export function FeaturedCarousel({ articles }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  if (!articles || articles.length === 0) return null;

  const currentArticle = articles[currentIndex];

  const goToPrevious = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? articles.length - 1 : prev - 1));
      setIsAnimating(false);
    }, 150);
  };

  const goToNext = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === articles.length - 1 ? 0 : prev + 1));
      setIsAnimating(false);
    }, 150);
  };

  const goToSlide = (index: number) => {
    if (index === currentIndex) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsAnimating(false);
    }, 150);
  };

  return (
    <div className="mb-8">
      {/* Heading with Navigation Arrows */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-black mb-2">NỔI BẬT NHẤT</h2>
          <div className="h-1 w-24 bg-brand-green-500 rounded"></div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevious}
            className="h-8 w-8 p-0 border-brand-green-500 text-brand-green-500 hover:bg-brand-green-50"
            aria-label="Bài trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            className="h-8 w-8 p-0 border-brand-green-500 text-brand-green-500 hover:bg-brand-green-50"
            aria-label="Bài sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Featured Article Card */}
      {currentArticle && (
        <Link href={`/news/${currentArticle.slug}`} className="group block">
          <div 
            className={`grid grid-cols-1 lg:grid-cols-3 gap-0 transition-opacity duration-300 ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
          >
            {/* Green Background Block with Title and Image */}
            <div className="lg:col-span-2 relative bg-brand-green-500 p-6 md:p-8 min-h-[300px] flex items-center">
              <div className="flex-1 z-10 pr-4">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 line-clamp-4">
                  {currentArticle.title.toUpperCase()}
                </h2>
              </div>
              <div className="hidden md:block w-64 h-64 ml-4 relative shrink-0">
                {currentArticle.thumbnailUrl.includes("cloudinary.com") ||
                currentArticle.thumbnailUrl.startsWith("http") ? (
                  <img
                    src={currentArticle.thumbnailUrl}
                    alt={currentArticle.title}
                    className="w-full h-full object-cover rounded-lg shadow-lg"
                  />
                ) : (
                  <Image
                    src={currentArticle.thumbnailUrl}
                    alt={currentArticle.title}
                    fill
                    className="object-cover rounded-lg shadow-lg"
                    sizes="256px"
                  />
                )}
              </div>
            </div>

            {/* Article Details */}
            <div className="lg:col-span-1 bg-white p-6">
              <h3 className="text-xl font-bold mb-3 group-hover:text-brand-green-500 transition-colors text-black">
                {currentArticle.title}
              </h3>
              {currentArticle.summary && (
                <p className="text-gray-600 mb-4 line-clamp-4">
                  {currentArticle.summary}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <span className="px-2 py-1 bg-brand-green-100 text-brand-green-800 rounded-full text-xs">
                  {currentArticle.category}
                </span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDate(
                      currentArticle.publishedAt || currentArticle.createdAt
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{currentArticle.authorName}</span>
                <div className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>{currentArticle.viewCount} lượt xem</span>
                </div>
              </div>

              {/* Pagination Dots */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {articles.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      goToSlide(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? "bg-black w-8"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Chuyển đến bài ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  );
}
