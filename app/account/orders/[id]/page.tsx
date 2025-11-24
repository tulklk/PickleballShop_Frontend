"use client";

import { useParams } from "next/navigation";
import { useOrder, useProduct } from "@/lib/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateTime } from "@/lib/utils/formatDate";
import { RequireAuth } from "@/lib/auth/guards";
import Image from "next/image";
import { Package } from "lucide-react";
import type { OrderItemDto } from "@/lib/api/types";

export default function OrderDetailPage() {
  return <OrderDetailContent />;
}

function OrderDetailContent() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Đang tải chi tiết đơn hàng...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Không tìm thấy đơn hàng.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Chi tiết đơn hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
              <p className="font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ngày đặt hàng</p>
              <p className="font-medium">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <p className="font-medium">{order.orderStatus}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái thanh toán</p>
              <p className="font-medium">{order.paymentStatus}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phương thức thanh toán</p>
              <p className="font-medium">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng tiền</p>
              <p className="font-bold text-lg text-primary">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Địa chỉ giao hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p className="text-muted-foreground">
              {order.shippingAddress.phoneNumber}
            </p>
            <p className="text-muted-foreground">
              {order.shippingAddress.addressLine}
            </p>
            <p className="text-muted-foreground">
              {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sản phẩm đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <OrderItemDetailCard key={item.id} item={item} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component to display order item with product image in detail page
function OrderItemDetailCard({ item }: { item: OrderItemDto }) {
  // Try to get product image from item, or fetch from productId if needed
  const shouldFetchProduct = !item.productImageUrl && !!item.productId;
  const { data: product } = useProduct(shouldFetchProduct ? item.productId : "");

  // Get image URL: from item, or from fetched product, or placeholder
  const imageUrl = 
    item.productImageUrl || 
    product?.primaryImageUrl || 
    product?.imageUrls?.[0] || 
    null;

  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return url.startsWith("/") || url.startsWith("./");
    }
  };

  return (
    <div className="flex gap-4 items-center border-b pb-4">
      {/* Product Image */}
      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-emerald-100">
        {imageUrl && isValidUrl(imageUrl) ? (
          <Image
            src={imageUrl}
            alt={item.productName || "Sản phẩm"}
            fill
            className="object-cover"
            sizes="80px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-8 w-8 text-emerald-400" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-lg mb-1">
          {item.productName || "Sản phẩm"}
        </p>
        <p className="text-sm text-muted-foreground">
          Số lượng: {item.quantity}
        </p>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p className="font-medium text-muted-foreground mb-1">
          {formatCurrency(item.unitPrice)} x {item.quantity}
        </p>
        <p className="text-primary font-bold text-lg">
          {formatCurrency(item.lineTotal)}
        </p>
      </div>
    </div>
  );
}

