import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { ProductListDto, ProductDto } from "@/lib/api/types";
import { Star } from "lucide-react";
import { getProductUrl } from "@/lib/utils/productUrl";
import { optimizeCloudinarySrc } from "@/lib/utils/cloudinaryImage";

interface ProductCardProps {
  product: ProductListDto | ProductDto;
  /** When false, hides the brand/category line below the product name (e.g. in New Products section). Default true. */
  showBrand?: boolean;
}

function isProductDto(product: ProductListDto | ProductDto): product is ProductDto {
  return "imageUrls" in product;
}

export function ProductCard({ product, showBrand = true }: ProductCardProps) {
  // Helper function to validate URL
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return false;
    }
    // Check if it's a valid URL (http/https) or a relative path starting with /
    try {
      if (url.startsWith('/')) {
        return true; // Relative path is valid
      }
      if (url.startsWith('http://') || url.startsWith('https://')) {
        new URL(url);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Get image URL with validation
  const getImageUrl = (): string => {
    const primaryUrl = product.primaryImageUrl;
    const firstImageUrl = isProductDto(product) ? product.imageUrls?.[0] : undefined;
    
    // Try primaryImageUrl first
    if (isValidUrl(primaryUrl)) {
      return primaryUrl!;
    }
    
    // Try first image from imageUrls array
    if (isValidUrl(firstImageUrl)) {
      return firstImageUrl!;
    }
    
    // Fallback to placeholder
    return "/placeholder-product.jpg";
  };

  const rawImageUrl = getImageUrl();
  const imageUrl =
    rawImageUrl !== "/placeholder-product.jpg" &&
    rawImageUrl.includes("res.cloudinary.com")
      ? optimizeCloudinarySrc(rawImageUrl, { maxWidth: 640 })
      : rawImageUrl;

  const price = product.price;
  const originalPrice = "originalPrice" in product ? product.originalPrice : null;
  
  // Calculate discount percentage if product is on sale
  const discountPercentage = originalPrice && originalPrice > price
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : null;

  return (
    <Link href={getProductUrl(product)}>
      <Card className="group h-full flex flex-col product-card-hover shimmer-on-hover">
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          {imageUrl !== "/placeholder-product.jpg" ? (
            <Image
              src={imageUrl}
              alt={product.name || "Sản phẩm"}
              fill
              className="object-cover image-zoom"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
          {/* Discount Badge */}
          {discountPercentage !== null && discountPercentage > 0 && (
            <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md z-10">
              -{discountPercentage}%
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1">
          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600">
            {product.name}
          </h3>
          {showBrand && product.brand && (
            <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
          )}
          {/* Star Rating */}
          {"averageRating" in product && (
            <div className="flex items-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= (product.averageRating || 5)
                      ? "fill-yellow-500 text-yellow-500"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg font-bold text-red-600">
              {formatCurrency(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

