"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, Plus, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, useUpdateCartItem, useDeleteCartItem } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/useAuth";
import { getGuestCart, GuestCartItem } from "@/lib/utils/guestCart";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatVariantInfoWithMm } from "@/lib/utils/variantDisplay";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CartPreviewProps {
  onClose?: () => void;
}

export function CartPreview({ onClose }: CartPreviewProps) {
  const { isAuthenticated } = useAuth();
  const { data: cart } = useCart();
  const updateCartItem = useUpdateCartItem();
  const deleteCartItem = useDeleteCartItem();
  const queryClient = useQueryClient();
  const [guestCartItems, setGuestCartItems] = useState<GuestCartItem[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      setGuestCartItems(getGuestCart());
      const interval = setInterval(() => {
        setGuestCartItems(getGuestCart());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const handleUpdateQuantity = async (cartItemId: string, newQuantity: number, currentQuantity: number) => {
    if (newQuantity < 1) return;
    if (newQuantity === currentQuantity) return;
    
    if (!isAuthenticated) {
      // Update guest cart
      const guestCart = getGuestCart();
      const itemIndex = guestCart.findIndex(
        (item, idx) => `guest-${idx}` === cartItemId
      );
      if (itemIndex >= 0) {
        guestCart[itemIndex].quantity = newQuantity;
        localStorage.setItem("guestCart", JSON.stringify(guestCart));
        window.dispatchEvent(new Event("storage"));
      }
      return;
    }

    try {
      await updateCartItem.mutateAsync({
        cartItemId,
        data: { quantity: newQuantity },
      });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
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
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Đã xóa sản phẩm");
    } catch (error) {
      toast.error("Không thể xóa sản phẩm");
    }
  };

  // Get cart items based on auth status
  const items = isAuthenticated
    ? cart?.items || []
    : guestCartItems;

  const totalAmount = isAuthenticated
    ? (cart?.subTotal || cart?.items?.reduce((sum, item) => sum + (item.lineTotal || item.unitPrice * item.quantity), 0) || 0)
    : guestCartItems.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);

  // Helper to get valid image URL
  const getImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    if (url.startsWith("data:")) return url;
    if (url.includes("cloudinary.com")) return url;
    try {
      new URL(url);
      return url;
    } catch {
      return null;
    }
  };

  // Empty cart state - styled like reference image
  if (items.length === 0) {
    return (
      <div className="w-72 p-6 text-center">
        {/* Shopping Bag Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <ShoppingBag className="h-16 w-16 text-gray-300 stroke-[1.5]" />
          </div>
        </div>
        
        <p className="text-gray-500 text-sm mb-4 italic">
          Chưa có sản phẩm trong giỏ hàng.
        </p>
        
        <Link href="/products" onClick={onClose}>
          <Button 
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold uppercase tracking-wide"
          >
            QUAY TRỞ LẠI CỬA HÀNG
          </Button>
        </Link>
      </div>
    );
  }

  return (
  <div className="w-full max-w-sm sm:w-80">
      {/* Cart Items */}
      <div className="max-h-80 overflow-y-auto">
        {items.slice(0, 5).map((item, index) => {
          const imageUrl = isAuthenticated
            ? getImageUrl((item as any).productImageUrl)
            : getImageUrl((item as GuestCartItem).productImageUrl);
          const productName = isAuthenticated
            ? (item as any).productName
            : (item as GuestCartItem).productName;
          // Try multiple price fields - backend may return unitPrice, price, or lineTotal
          const unitPrice = isAuthenticated
            ? ((item as any).unitPrice || (item as any).price || ((item as any).lineTotal / item.quantity) || 0)
            : ((item as GuestCartItem).unitPrice || 0);
          const quantity = item.quantity;
          const lineTotal = (item as any).lineTotal || unitPrice * quantity;

          const cartItemId = isAuthenticated ? (item as any).id : `guest-${index}`;
          const variantInfo = isAuthenticated
            ? (item as any).variantInfo
            : (item as GuestCartItem).variantInfo;

          return (
            <div
              key={cartItemId}
              className="flex items-start gap-3 p-3 border-b border-gray-100 hover:bg-gray-50"
            >
              {/* Product Image */}
              <div className="relative h-16 w-16 shrink-0 rounded-md overflow-hidden bg-gray-100">
                {imageUrl ? (
                  imageUrl.includes("cloudinary.com") ? (
                    <img
                      src={imageUrl}
                      alt={productName || "Sản phẩm"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Image
                      src={imageUrl}
                      alt={productName || "Sản phẩm"}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-200">
                    <span className="text-xs text-gray-400">No img</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">
                  {productName || "Sản phẩm"}
                </p>
                    {variantInfo && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatVariantInfoWithMm(variantInfo)}
                      </p>
                    )}
                  </div>
                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveItem(cartItemId);
                    }}
                    className="shrink-0 p-1 hover:bg-red-100 rounded-full transition-colors"
                    aria-label="Xóa sản phẩm"
                  >
                    <X className="h-4 w-4 text-gray-500 hover:text-red-600" />
                  </button>
                </div>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUpdateQuantity(cartItemId, quantity - 1, quantity);
                      }}
                      className="p-1 hover:bg-gray-100 transition-colors"
                      disabled={quantity <= 1}
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="h-3 w-3 text-gray-600" />
                    </button>
                    <span className="px-2 py-1 text-sm min-w-8 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleUpdateQuantity(cartItemId, quantity + 1, quantity);
                      }}
                      className="p-1 hover:bg-gray-100 transition-colors"
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="h-3 w-3 text-gray-600" />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-red-600 ml-auto">
                    {formatCurrency(lineTotal)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {items.length > 5 && (
          <div className="p-2 text-center text-sm text-muted-foreground">
            +{items.length - 5} sản phẩm khác
          </div>
        )}
      </div>

      {/* Total */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-muted-foreground">Tổng số phụ:</span>
          <span className="text-base font-semibold text-primary">
            {formatCurrency(totalAmount)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Link href="/cart" onClick={onClose} className="w-full">
            <Button variant="outline" className="w-full">
              XEM GIỎ HÀNG
            </Button>
          </Link>
          <Link href="/checkout" onClick={onClose} className="w-full">
            <Button className="w-full bg-lime-400 hover:bg-lime-500 text-gray-900 font-semibold">
              THANH TOÁN
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

