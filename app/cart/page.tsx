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
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading cart...</div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Start shopping to add items to your cart
          </p>
          <Link href="/products">
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <Button variant="outline" onClick={handleClearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={item.productImageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23e5e7eb'/%3E%3C/svg%3E"}
                      alt={item.productName || "Product"}
                      fill
                      className="object-cover rounded"
                      sizes="96px"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{item.productName}</h3>
                    <p className="text-primary font-bold mb-2">
                      {formatCurrency(item.unitPrice)}
                    </p>
                    <div className="flex items-center gap-2">
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
                      Subtotal: {formatCurrency(item.lineTotal)}
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
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Items ({cart.totalItems})</span>
                <span>{formatCurrency(cart.subTotal)}</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
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

