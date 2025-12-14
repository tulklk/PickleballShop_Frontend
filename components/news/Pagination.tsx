"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageUrl = (page: number) => {
    if (page === 1) return baseUrl;
    return `${baseUrl}?page=${page}`;
  };

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className={`flex items-center justify-center gap-2 mt-8 ${className}`}>
      {/* First page */}
      {currentPage > 1 && (
        <Link href={getPageUrl(1)}>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0"
            aria-label="Trang đầu"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </Link>
      )}

      {/* Previous page */}
      {currentPage > 1 && (
        <Link href={getPageUrl(currentPage - 1)}>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0"
            aria-label="Trang trước"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
      )}

      {/* Page numbers */}
      {getVisiblePages().map((page, index) => {
        if (page === "...") {
          return (
            <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
              ...
            </span>
          );
        }

        const pageNum = page as number;
        const isActive = pageNum === currentPage;

        return (
          <Link key={pageNum} href={getPageUrl(pageNum)}>
            <Button
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={`h-10 w-10 p-0 ${
                isActive
                  ? "bg-brand-green-500 hover:bg-brand-green-600 text-white border-brand-green-500"
                  : "border-brand-green-500 text-brand-green-500 hover:bg-brand-green-50"
              }`}
              aria-label={`Trang ${pageNum}`}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNum}
            </Button>
          </Link>
        );
      })}

      {/* Next page */}
      {currentPage < totalPages && (
        <Link href={getPageUrl(currentPage + 1)}>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 border-brand-green-500 text-brand-green-500 hover:bg-brand-green-50"
            aria-label="Trang sau"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      )}

      {/* Last page */}
      {currentPage < totalPages && (
        <Link href={getPageUrl(totalPages)}>
          <Button
            variant="outline"
            size="sm"
            className="h-10 w-10 p-0 border-brand-green-500 text-brand-green-500 hover:bg-brand-green-50"
            aria-label="Trang cuối"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  );
}
