"use client";

import { useMyOrders } from "@/lib/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Calendar, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Receipt
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { useProduct } from "@/lib/api/hooks";
import type { OrderItemDto } from "@/lib/api/types";

export default function OrdersPage() {
  return <OrdersContent />;
}

function getStatusBadge(orderStatus: string | null) {
  if (!orderStatus) return null;
  
  const status = orderStatus.toLowerCase();
  if (status.includes("completed") || status.includes("hoàn thành")) {
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Hoàn thành
      </Badge>
    );
  }
  if (status.includes("pending") || status.includes("chờ")) {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
        <Clock className="h-3 w-3 mr-1" />
        Đang chờ
      </Badge>
    );
  }
  if (status.includes("processing") || status.includes("xử lý")) {
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
        <Truck className="h-3 w-3 mr-1" />
        Đang xử lý
      </Badge>
    );
  }
  if (status.includes("cancelled") || status.includes("hủy")) {
    return (
      <Badge className="bg-red-500 hover:bg-red-600 text-white">
        <XCircle className="h-3 w-3 mr-1" />
        Đã hủy
      </Badge>
    );
  }
  if (status.includes("shipped") || status.includes("giao")) {
    return (
      <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
        <Truck className="h-3 w-3 mr-1" />
        Đang giao
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      {orderStatus}
    </Badge>
  );
}

function getPaymentStatusBadge(paymentStatus: string | null) {
  if (!paymentStatus) return null;
  
  const status = paymentStatus.toLowerCase();
  if (status.includes("completed") || status.includes("paid") || status.includes("hoàn thành")) {
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Đã thanh toán
      </Badge>
    );
  }
  if (status.includes("pending") || status.includes("chờ")) {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
        <Clock className="h-3 w-3 mr-1" />
        Chờ thanh toán
      </Badge>
    );
  }
  if (status.includes("failed") || status.includes("thất bại")) {
    return (
      <Badge className="bg-red-500 hover:bg-red-600 text-white">
        <XCircle className="h-3 w-3 mr-1" />
        Thất bại
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      {paymentStatus}
    </Badge>
  );
}

function getPaymentMethodLabel(method: string | null) {
  if (!method) return "Chưa xác định";
  const m = method.toLowerCase();
  if (m.includes("cod")) return "Thanh toán khi nhận hàng";
  if (m.includes("momo")) return "Ví MoMo";
  if (m.includes("vnpay")) return "VNPay";
  if (m.includes("bank") || m.includes("payos")) return "Chuyển khoản";
  return method;
}

function OrdersContent() {
  const { data: orders, isLoading } = useMyOrders();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
        <p className="text-emerald-900/70 text-lg">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="h-20 w-20 mx-auto mb-6 text-emerald-500/50" />
        <h2 className="text-2xl font-bold mb-2 text-emerald-900">
          Chưa có đơn hàng nào
        </h2>
        <p className="text-muted-foreground mb-8">
          Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!
        </p>
        <Link href="/products">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Bắt đầu mua sắm
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
          Đơn hàng của tôi
        </h1>
        <p className="text-muted-foreground">
          Bạn có {orders.length} {orders.length === 1 ? "đơn hàng" : "đơn hàng"}
        </p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => {
          const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          
          return (
            <Card 
              key={order.id} 
              className="border-emerald-100 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg text-emerald-900">
                        {order.orderNumber || `Đơn hàng #${order.id.slice(0, 8)}`}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    {getStatusBadge(order.orderStatus)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* Order Items */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-4 w-4 text-emerald-600" />
                    <h3 className="font-semibold text-emerald-900">
                      Sản phẩm ({totalItems} {totalItems === 1 ? "sản phẩm" : "sản phẩm"})
                    </h3>
                  </div>
                  <div className="space-y-3">
                    {order.items?.map((item) => (
                      <OrderItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t border-emerald-100 pt-4 mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Phương thức thanh toán</p>
                        <p className="font-medium text-emerald-900">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                        <CheckCircle2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Trạng thái thanh toán</p>
                        <div>
                          {getPaymentStatusBadge(order.paymentStatus)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end">
                  <Link href={`/account/orders/${order.id}`}>
                    <Button 
                      variant="outline" 
                      className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                    >
                      <Receipt className="mr-2 h-4 w-4" />
                      Xem chi tiết
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// Component to display order item with product image
function OrderItemCard({ item }: { item: OrderItemDto }) {
  const shouldFetchProduct = !item.productImageUrl && !!item.productId;
  const { data: product } = useProduct(shouldFetchProduct ? item.productId : "");

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
    <div className="flex gap-3 p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
      {/* Product Image */}
      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-emerald-100">
        {imageUrl && isValidUrl(imageUrl) ? (
          <Image
            src={imageUrl}
            alt={item.productName || "Sản phẩm"}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-6 w-6 text-emerald-400" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-emerald-900 line-clamp-2">
          {item.productName || "Sản phẩm"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Số lượng: {item.quantity} × {formatCurrency(item.unitPrice)}
        </p>
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        <p className="font-semibold text-emerald-600">
          {formatCurrency(item.lineTotal)}
        </p>
      </div>
    </div>
  );
}
