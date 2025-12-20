"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: AdminPaginationProps) {
  if (totalPages <= 1) return null;

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
    <div className={`flex items-center justify-center gap-2 mt-6 ${className}`}>
      {/* First page */}
      {currentPage > 1 && (
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0"
          onClick={() => onPageChange(1)}
          aria-label="Trang đầu"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Previous page */}
      {currentPage > 1 && (
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0"
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
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
          <Button
            key={pageNum}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={`h-10 w-10 p-0 ${
              isActive
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                : "border-emerald-500 text-emerald-600 hover:bg-emerald-50"
            }`}
            onClick={() => onPageChange(pageNum)}
            aria-label={`Trang ${pageNum}`}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNum}
          </Button>
        );
      })}

      {/* Next page */}
      {currentPage < totalPages && (
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      {/* Last page */}
      {currentPage < totalPages && (
        <Button
          variant="outline"
          size="sm"
          className="h-10 w-10 p-0 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          onClick={() => onPageChange(totalPages)}
          aria-label="Trang cuối"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
