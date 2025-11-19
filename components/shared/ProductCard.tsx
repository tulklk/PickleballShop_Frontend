import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { ProductListDto, ProductDto } from "@/lib/api/types";
import { useAddCartItem } from "@/lib/api/hooks";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: ProductListDto | ProductDto;
}

export function ProductCard({ product }: ProductCardProps) {
  const addCartItem = useAddCartItem();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await addCartItem.mutateAsync({
        productId: product.id,
        quantity: 1,
      });
      toast.success("Added to cart!");
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const imageUrl = "primaryImageUrl" in product 
    ? product.primaryImageUrl 
    : "imageUrls" in product && product.imageUrls?.[0]
    ? product.imageUrls[0]
    : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EProduct Image%3C/text%3E%3C/svg%3E";

  const price = product.price;
  const originalPrice = "originalPrice" in product ? product.originalPrice : null;

  return (
    <Link href={`/products/${product.id}`}>
      <Card className="group hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative aspect-square overflow-hidden rounded-t-lg">
          <Image
            src={imageUrl || "/placeholder-product.jpg"}
            alt={product.name || "Product"}
            fill
            className="object-cover group-hover:scale-105 transition-transform"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        <CardContent className="p-4 flex-1">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-sm text-muted-foreground mb-2">{product.brand}</p>
          )}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-bold text-primary">
              {formatCurrency(price)}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>
          {"averageRating" in product && product.averageRating && (
            <div className="text-sm text-muted-foreground">
              ⭐ {product.averageRating.toFixed(1)} ({product.reviewCount} reviews)
            </div>
          )}
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

