 "use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useWishlist, useProduct } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { WishlistItem } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { useAddCartItem } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/useAuth";
import { addToGuestCart } from "@/lib/utils/guestCart";
import { getProductUrl } from "@/lib/utils/productUrl";

function WishlistProductCard({
  item,
  onRemove,
  isRemoving,
}: {
  item: WishlistItem;
  onRemove: (productId: string) => void;
  isRemoving: boolean;
}) {
  const { data: product, isLoading } = useProduct(item.productId);
  const addCartItem = useAddCartItem();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  if (isLoading || !product) {
    return (
      <Card className="border-emerald-100">
        <CardContent className="p-6">
          <div className="h-20 w-full bg-emerald-50/60 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const image =
    product.primaryImageUrl ||
    product.imageUrls?.[0] ||
    "/placeholder-product.jpg";

  const hasDiscount =
    product.originalPrice !== null &&
    product.originalPrice !== undefined &&
    product.originalPrice > product.price;

  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / (product.originalPrice as number)) * 100)
    : 0;

  const handleAddToCart = async () => {
    // Guest user: lưu vào localStorage
    if (!isAuthenticated) {
      addToGuestCart({
        productId: product.id,
        quantity: 1,
        productName: product.name || undefined,
        productImageUrl:
          product.primaryImageUrl || product.imageUrls?.[0] || undefined,
        unitPrice: product.price,
      });
      toast.success("Đã thêm vào giỏ hàng!");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      return;
    }

    // Đã đăng nhập: gọi API
    try {
      await addCartItem.mutateAsync({
        productId: product.id,
        quantity: 1,
      });
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || "Không thể thêm vào giỏ hàng";
      toast.error(message);
    }
  };

  return (
    <Card className="border-emerald-100">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Ảnh sản phẩm nhỏ bên trái */}
          <Link
            href={getProductUrl(product)}
            className="relative w-28 h-28 rounded-md overflow-hidden bg-gray-100 flex-shrink-0"
          >
            {image === "/placeholder-product.jpg" ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xs text-gray-400">
                No Image
              </div>
            ) : image.startsWith("http") || image.startsWith("/") ? (
              <Image
                src={image}
                alt={product.name || ""}
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <img
                src={image}
                alt={product.name || ""}
                className="w-full h-full object-cover"
              />
            )}
          </Link>

          {/* Thông tin sản phẩm */}
          <div className="flex-1">
            <Link href={getProductUrl(product)}>
              <h2 className="font-semibold text-base mb-1 line-clamp-2 hover:text-emerald-700">
                {product.name}
              </h2>
            </Link>
            {product.brand && (
              <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
            )}

            <div className="flex items-center gap-2 mb-1">
              <span className="text-black font-bold text-base">
                {formatCurrency(product.price)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {formatCurrency(product.originalPrice as number)}
                </span>
              )}
            </div>

            {hasDiscount && (
              <div className="mb-2">
                <span className="inline-block rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                  -{discountPercent}%
                </span>
              </div>
            )}

            <div className="flex items-center gap-4 text-sm">
              <span className="inline-flex items-center gap-1 text-red-500">
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              </span>
              <button
                onClick={handleAddToCart}
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800"
                disabled={addCartItem.isPending}
              >
                <ShoppingCart className="h-4 w-4" />
                Thêm vào giỏ
              </button>
            </div>
          </div>

          {/* Nút xoá bên phải */}
          <button
            className="text-red-500 hover:text-red-600 p-1"
            onClick={() => onRemove(item.productId)}
            disabled={isRemoving}
            aria-label="Xóa khỏi yêu thích"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WishlistPage() {
  const { data: wishlist, isLoading } = useWishlist();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Force refetch wishlist when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Small delay to ensure auth state is fully updated
      const timer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, queryClient]);

  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      await apiClient.removeFromWishlist(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Đã xóa sản phẩm khỏi danh sách yêu thích");
    },
    onError: (error: any) => {
      const message =
        error?.data?.message ||
        error?.message ||
        "Không thể xóa sản phẩm khỏi danh sách yêu thích";
      toast.error(message);
    },
  });

  const hasItems = wishlist && wishlist.length > 0;

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-emerald-900 flex items-center gap-2">
            <Heart className="h-6 w-6 text-emerald-600" />
            Sản phẩm yêu thích
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Danh sách các sản phẩm bạn đã đánh dấu yêu thích.
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Đang tải danh sách yêu thích...</p>
      ) : !hasItems ? (
        <Card className="border-emerald-100">
          <CardContent className="p-6 text-center text-gray-600">
            <p className="mb-2 font-medium">Bạn chưa có sản phẩm yêu thích nào.</p>
            <p className="mb-4 text-sm">
              Hãy nhấn nút{" "}
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <Heart className="h-4 w-4" /> yêu thích
              </span>{" "}
              trên trang sản phẩm để thêm vào danh sách.
            </p>
            <Link href="/products">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Xem sản phẩm
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {wishlist!.map((item) => (
            <WishlistProductCard
              key={item.id}
              item={item}
              onRemove={(productId) => removeMutation.mutate(productId)}
              isRemoving={removeMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}



