"use client";

import { useCart, useUpdateCartItem, useDeleteCartItem, useClearCart } from "@/lib/api/hooks";
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

export default function CartPage() {
  return <CartContent />;
}

function CartContent() {
  const router = useRouter();
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
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thanh toán");
      router.push("/login");
      return;
    }
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
            <Card key={item.id}>
              <CardContent className="p-3 md:p-4">
                <div className="flex gap-3 md:gap-4">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                    {(() => {
                      // Helper to validate URL
                      const isValidUrl = (url: string | null | undefined): boolean => {
                        if (!url || typeof url !== 'string' || url.trim() === '') {
                          return false;
                        }
                        // Data URLs are valid
                        if (url.startsWith('data:')) {
                          return true;
                        }
                        // Check if it's a valid URL (http/https) or relative path
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

                      const imageUrl = item.productImageUrl;
                      const isValid = isValidUrl(imageUrl);
                      const isDataUrl = imageUrl?.startsWith('data:');
                      const isCloudinaryUrl = imageUrl?.includes('cloudinary.com') || imageUrl?.includes('res.cloudinary.com');
                      
                      // Use regular img tag for data URLs, Cloudinary URLs, or invalid URLs
                      if (isDataUrl || isCloudinaryUrl || !isValid) {
                        const fallbackUrl = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23e5e7eb'/%3E%3C/svg%3E";
                        return (
                          <img
                            src={isValid && imageUrl ? imageUrl : fallbackUrl}
                            alt={item.productName || "Sản phẩm"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackUrl;
                            }}
                          />
                        );
                      }
                      
                      // Use Next.js Image for valid HTTP/HTTPS URLs
                      return (
                        <Image
                          src={imageUrl!}
                          alt={item.productName || "Product"}
                          fill
                          className="object-cover"
                          sizes="96px"
                          unoptimized={isCloudinaryUrl}
                          onError={(e) => {
                            // Fallback to placeholder on error
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              parent.innerHTML = `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23e5e7eb'/%3E%3C/svg%3E" alt="${item.productName || 'Product'}" class="w-full h-full object-cover" />`;
                            }
                          }}
                        />
                      );
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base line-clamp-2">{item.productName}</h3>
                    {/* Variant Info */}
                    {"variantInfo" in item && item.variantInfo && (
                      <p className="text-xs md:text-sm text-gray-500 mb-1">
                        📦 {item.variantInfo}
                      </p>
                    )}
                    <p className="text-primary font-bold mb-2 text-sm md:text-base">
                      {formatCurrency(item.unitPrice)}
                    </p>
                    <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="ml-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Tạm tính: {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tóm tắt đơn hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Sản phẩm ({cart.totalItems})</span>
                <span>{formatCurrency(cart.subTotal)}</span>
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
                {isAuthenticated ? "Thanh toán" : "Đăng nhập để thanh toán"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

