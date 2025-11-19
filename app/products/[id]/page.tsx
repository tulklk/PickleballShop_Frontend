"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useProduct, useAddCartItem } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useState } from "react";
import { toast } from "sonner";
import { ShoppingCart } from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { data: product, isLoading } = useProduct(productId);
  const addCartItem = useAddCartItem();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    try {
      await addCartItem.mutateAsync({
        productId: product!.id,
        quantity,
      });
      toast.success("Added to cart!");
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">Product not found.</div>
    );
  }

  const images = product.imageUrls || [];
  const primaryImage = product.primaryImageUrl || images[0] || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Crect width='400' height='400' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' fill='%239ca3af' text-anchor='middle' dy='.3em'%3EProduct Image%3C/text%3E%3C/svg%3E";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="relative aspect-square mb-4">
            <Image
              src={primaryImage}
              alt={product.name || "Product"}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((img, idx) => (
                <div key={idx} className="relative aspect-square">
                  <Image
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    fill
                    className="object-cover rounded"
                    sizes="(max-width: 768px) 25vw, 12.5vw"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          
          {product.brand && (
            <p className="text-lg text-muted-foreground mb-4">Brand: {product.brand}</p>
          )}

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xl text-muted-foreground line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>

          {product.averageRating && (
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐ {product.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({product.reviewCount} reviews)
                </span>
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-2">Stock: {product.stockQuantity}</p>
            <p className="text-sm text-muted-foreground mb-2">SKU: {product.sku || "N/A"}</p>
            {product.productType && (
              <p className="text-sm text-muted-foreground">Type: {product.productType}</p>
            )}
          </div>

          {product.description && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium">Quantity:</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                -
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
              >
                +
              </Button>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            disabled={addCartItem.isPending || product.stockQuantity === 0}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}

