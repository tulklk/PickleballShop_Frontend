"use client";

import { ProductCard } from "./ProductCard";
import type { ProductListDto, ProductDto } from "@/lib/api/types";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";
import { useEffect, useState, useMemo } from "react";

interface ProductGridProps {
  products: (ProductListDto | ProductDto)[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const { ref: gridRef, isVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: false });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  
  // Create a key based on product IDs to detect when products change
  const productsKey = useMemo(() => 
    products.map(p => p.id).join(','), 
    [products]
  );

  // Reset and trigger animation when products change or become visible
  useEffect(() => {
    setShouldAnimate(false);
    // Small delay to allow DOM to update before animating
    const timer = setTimeout(() => {
      if (isVisible) {
        setShouldAnimate(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [isVisible, productsKey]);

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No products found.
      </div>
    );
  }

  return (
    <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => (
        <div
          key={product.id}
          className={`scroll-animate-stagger ${shouldAnimate ? 'visible' : ''}`}
          style={{ 
            transitionDelay: shouldAnimate ? `${index * 0.08}s` : '0s' 
          }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}

