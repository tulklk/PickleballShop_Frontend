import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { ProductListDto, ProductDto } from "@/lib/api/types";
import { useAddCartItem } from "@/lib/api/hooks";
import { toast } from "sonner";
import { ShoppingCart, Star } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { addToGuestCart } from "@/lib/utils/guestCart";
import { useQueryClient } from "@tanstack/react-query";
import { getProductUrl } from "@/lib/utils/productUrl";

interface ProductCardProps {
  product: ProductListDto | ProductDto;
}

function isProductDto(product: ProductListDto | ProductDto): product is ProductDto {
  return "imageUrls" in product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addCartItem = useAddCartItem();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // If not authenticated, save to localStorage (guest cart)
    if (!isAuthenticated) {
      addToGuestCart({
        productId: product.id,
        quantity: 1,
        productName: product.name || undefined,
        productImageUrl: product.primaryImageUrl || (isProductDto(product) ? product.imageUrls?.[0] : undefined) || undefined,
        unitPrice: product.price,
      });
      toast.success("Đã thêm vào giỏ hàng! Đăng nhập để thanh toán.");
      // Invalidate cart query to update cart count in navbar
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      return;
    }

    // If authenticated, use API
    try {
      await addCartItem.mutateAsync({
        productId: product.id,
        quantity: 1,
      });
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (error: any) {
      // If API fails, fallback to guest cart
      if (error?.status === 500 || error?.status >= 500) {
        console.warn("API failed, saving to guest cart as fallback:", error);
        addToGuestCart({
          productId: product.id,
          quantity: 1,
          productName: product.name || undefined,
          productImageUrl: product.primaryImageUrl || (isProductDto(product) ? product.imageUrls?.[0] : undefined) || undefined,
          unitPrice: product.price,
        });
        toast.warning("Đã lưu vào giỏ hàng tạm thời. Vui lòng thử lại sau.");
        queryClient.invalidateQueries({ queryKey: ["cart"] });
      } else {
        const errorMessage = 
          error?.data?.message || error?.message || "Không thể thêm vào giỏ hàng";
        toast.error(errorMessage);
      }
    }
  };

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

  const imageUrl = getImageUrl();

  const price = product.price;
  const originalPrice = "originalPrice" in product ? product.originalPrice : null;

  return (
    <Link href={getProductUrl(product)}>
      <Card className="group hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          {imageUrl !== "/placeholder-product.jpg" ? (
            <Image
              src={imageUrl}
              alt={product.name || "Product"}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-400 text-sm">No Image</span>
            </div>
          )}
        </div>
        <CardContent className="p-4 flex-1">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary">
            {product.name}
          </h3>
          {product.brand && (
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
                      ? "fill-emerald-500 text-emerald-500"
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
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={addCartItem.isPending}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}

