'use client';

import {
  useCart,
  useUpdateCartItem,
  useDeleteCartItem,
  useClearCart,
  useProduct,
} from "@/lib/api/hooks";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useAuth } from "@/lib/auth/useAuth";
import { useRouter } from "next/navigation";
import { getGuestCart, clearGuestCart } from "@/lib/utils/guestCart";
import type { CartItemDto } from "@/lib/api/types";
import { formatVariantInfoWithMm } from "@/lib/utils/variantDisplay";

export default function CartPage() {
  return <CartContent />;
}

function CartContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: cart, isLoading } = useCart();
  const updateCartItem = useUpdateCartItem();
  const deleteCartItem = useDeleteCartItem();
  const clearCart = useClearCart();

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    if (!isAuthenticated) {
      // Update guest cart
      const guestCart = getGuestCart();
      const itemIndex = guestCart.findIndex(
        (item, idx) => `guest-${idx}` === cartItemId
      );
      if (itemIndex >= 0) {
        guestCart[itemIndex].quantity = newQuantity;
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        // Trigger cart refresh
        window.dispatchEvent(new Event("storage"));
        toast.success("Đã cập nhật số lượng");
      }
      return;
    }

    try {
      await updateCartItem.mutateAsync({
        cartItemId,
        data: { quantity: newQuantity },
      });
    } catch (error) {
      toast.error("Không thể cập nhật số lượng");
    }
  };

  const handleRemoveItem = async (cartItemId: string) => {
    if (!isAuthenticated) {
      // Remove from guest cart
      const guestCart = getGuestCart();
      const itemIndex = guestCart.findIndex(
        (item, idx) => `guest-${idx}` === cartItemId
      );
      if (itemIndex >= 0) {
        guestCart.splice(itemIndex, 1);
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        window.dispatchEvent(new Event("storage"));
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        await queryClient.refetchQueries({ queryKey: ["cart"], type: "active" });
        toast.success("Đã xóa sản phẩm");
      }
      return;
    }

    try {
      await deleteCartItem.mutateAsync(cartItemId);
      toast.success("Đã xóa sản phẩm");
    } catch (error) {
      toast.error("Không thể xóa sản phẩm");
    }
  };

  const handleClearCart = async () => {
    if (!isAuthenticated) {
      clearGuestCart();
      window.dispatchEvent(new Event("storage"));
      toast.success("Đã xóa giỏ hàng");
      return;
    }

    try {
      await clearCart.mutateAsync();
      toast.success("Đã xóa giỏ hàng");
    } catch (error) {
      toast.error("Không thể xóa giỏ hàng");
    }
  };

  const handleCheckout = () => {
    router.push("/checkout");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="text-center">Đang tải giỏ hàng...</div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="text-center py-8 md:py-16">
          <ShoppingBag className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl md:text-2xl font-bold mb-2">Giỏ hàng của bạn trống</h2>
          <p className="text-muted-foreground mb-6">
            Bắt đầu mua sắm để thêm sản phẩm vào giỏ hàng
          </p>
          <Link href="/products">
            <Button>Xem sản phẩm</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Giỏ hàng</h1>
        <Button variant="outline" onClick={handleClearCart} size="sm" className="text-xs md:text-sm">
          Xóa giỏ hàng
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-3 md:space-y-4">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Sản phẩm ({cart.totalItems})</span>
                  <span>{formatCurrency(cart.subTotal)}</span>
                </div>
                {cart.items.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-1 list-none pl-0">
                    {cart.items.map((item) => (
                      <li key={item.id} className="flex justify-between gap-2">
                        <span className="min-w-0 truncate">
                          {item.productName || "Sản phẩm"}
                          {"variantInfo" in item && item.variantInfo && (
                            <span className="text-emerald-600"> — {formatVariantInfoWithMm(item.variantInfo)}</span>
                          )}
                        </span>
                        <span className="shrink-0">×{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span>{formatCurrency(cart.subTotal)}</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleCheckout}
              >
                Thanh toán
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface CartItemRowProps {
  item: CartItemDto;
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemove: (cartItemId: string) => void;
}

function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { data: product } = useProduct(item.productId);

  const currentPrice = product?.price ?? item.unitPrice;
  const originalPrice = product?.originalPrice ?? null;
  const hasDiscount =
    originalPrice !== null && originalPrice !== undefined && originalPrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round((1 - currentPrice / (originalPrice as number)) * 100)
    : 0;

  // Helper to validate image URL
  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== "string" || url.trim() === "") {
      return false;
    }
    if (url.startsWith("data:")) return true;
    try {
      if (url.startsWith("/")) return true;
      if (url.startsWith("http://") || url.startsWith("https://")) {
        new URL(url);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const imageUrl = item.productImageUrl;
  const validImage = isValidUrl(imageUrl);
  const isDataUrl = imageUrl?.startsWith("data:");
  const isCloudinaryUrl =
    imageUrl?.includes("cloudinary.com") || imageUrl?.includes("res.cloudinary.com");

  return (
    <Card className="border-emerald-50 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Product image */}
          <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {(() => {
              const fallbackUrl =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23e5e7eb'/%3E%3C/svg%3E";

              if (isDataUrl || isCloudinaryUrl || !validImage) {
                return (
                  <img
                    src={validImage && imageUrl ? imageUrl : fallbackUrl}
                    alt={item.productName || "Sản phẩm"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = fallbackUrl;
                    }}
                  />
                );
              }

              return (
                <Image
                  src={imageUrl!}
                  alt={item.productName || "Product"}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized={isCloudinaryUrl}
                />
              );
            })()}
          </div>

          {/* Product info + actions */}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm md:text-base line-clamp-2 mb-1">
                  {item.productName}
                </h3>
                {"variantInfo" in item && item.variantInfo && (
                  <p className="text-xs md:text-sm text-gray-500">{formatVariantInfoWithMm(item.variantInfo)}</p>
                )}
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  <span className="font-medium text-gray-700">Tình trạng:</span>{" "}
                  <span className="text-emerald-600 font-semibold">Còn hàng</span>
                </p>
              </div>

              {/* Price + discount + line total */}
              <div className="text-right flex-shrink-0">
                <div className="flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base md:text-lg font-bold text-black">
                      {formatCurrency(currentPrice)}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-gray-400 line-through">
                        {formatCurrency(originalPrice as number)}
                      </span>
                    )}
                  </div>
                  {hasDiscount && (
                    <span className="inline-block rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                      -{discountPercent}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quantity controls */}
            <div className="mt-3 flex items-center gap-2 md:gap-3">
              <div className="flex items-center border rounded-full bg-white shadow-sm overflow-hidden">
                <button
                  className="h-8 w-8 flex items-center justify-center text-gray-700 hover:bg-emerald-50"
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  className="h-8 w-8 flex items-center justify-center text-gray-700 hover:bg-emerald-50"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(item.id)}
                className="ml-auto text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

