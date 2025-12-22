"use client";

import { useParams, useRouter } from "next/navigation";
import { useOrder, useProduct } from "@/lib/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateTime } from "@/lib/utils/formatDate";
import { RequireAuth } from "@/lib/auth/guards";
import Image from "next/image";
import { 
  Package, 
  Calendar, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle,
  MapPin,
  Receipt,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrderItemDto } from "@/lib/api/types";
import { OrderStatusBar } from "@/components/orders/OrderStatusBar";

export default function OrderDetailPage() {
  return <OrderDetailContent />;
}

function getStatusConfig(orderStatus: string | null) {
  if (!orderStatus) return { label: "Không xác định", color: "gray", icon: Clock };
  
  const status = orderStatus.toLowerCase();
  if (status.includes("completed") || status.includes("hoàn thành")) {
    return { label: "Hoàn thành", color: "emerald", icon: CheckCircle2 };
  }
  if (status.includes("pending") || status.includes("chờ")) {
    return { label: "Đang chờ", color: "amber", icon: Clock };
  }
  if (status.includes("processing") || status.includes("xử lý")) {
    return { label: "Đang xử lý", color: "blue", icon: Package };
  }
  if (status.includes("confirmed") || status.includes("xác nhận")) {
    return { label: "Đã xác nhận", color: "cyan", icon: CheckCircle2 };
  }
  if (status.includes("prepared") || status.includes("chuẩn bị")) {
    return { label: "Đã chuẩn bị hàng", color: "indigo", icon: Package };
  }
  if (status.includes("shipped") || status.includes("giao")) {
    return { label: "Đã giao cho đơn vị vận chuyển", color: "purple", icon: Truck };
  }
  if (status.includes("cancelled") || status.includes("hủy")) {
    return { label: "Đã hủy", color: "red", icon: XCircle };
  }
  return { label: orderStatus, color: "gray", icon: Clock };
}

function getPaymentStatusConfig(paymentStatus: string | null) {
  if (!paymentStatus) return { label: "Chưa xác định", color: "gray" };
  
  const status = paymentStatus.toLowerCase();
  if (status.includes("completed") || status.includes("paid") || status.includes("hoàn thành")) {
    return { label: "Đã thanh toán", color: "emerald" };
  }
  if (status.includes("pending") || status.includes("chờ")) {
    return { label: "Chờ thanh toán", color: "amber" };
  }
  if (status.includes("failed") || status.includes("thất bại")) {
    return { label: "Thất bại", color: "red" };
  }
  return { label: paymentStatus, color: "gray" };
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

function OrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const { data: order, isLoading } = useOrder(orderId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
        <p className="text-muted-foreground">Đang tải chi tiết đơn hàng...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <Package className="h-16 w-16 mx-auto mb-4 text-emerald-300" />
        <h2 className="text-xl font-semibold mb-2 text-emerald-900">
          Không tìm thấy đơn hàng
        </h2>
        <p className="text-muted-foreground mb-6">
          Đơn hàng này không tồn tại hoặc đã bị xóa.
        </p>
        <Button 
          variant="outline" 
          onClick={() => router.push("/account/orders")}
          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách đơn hàng
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.orderStatus);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 mt-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/account/orders")}
          className="hover:bg-emerald-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-emerald-900">Chi tiết đơn hàng</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {order.orderNumber || `#${order.id.slice(0, 8)}`}
          </p>
        </div>
      </div>

      {/* Row 1: Order Info and Summary - Same row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Order Info Card - Left */}
        <div className="lg:col-span-2">
          <Card className="border-emerald-100 h-full">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Receipt className="h-5 w-5" />
                Thông tin đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Mã đơn hàng</p>
                  <p className="font-medium text-emerald-900">{order.orderNumber || `#${order.id.slice(0, 8)}`}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Ngày đặt hàng
                  </p>
                  <p className="font-medium text-emerald-900">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Trạng thái đơn hàng</p>
                  <Badge 
                    className={`${
                      statusConfig.color === "emerald" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100" :
                      statusConfig.color === "amber" ? "bg-amber-100 text-amber-700 hover:bg-amber-100" :
                      statusConfig.color === "blue" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                      statusConfig.color === "red" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                      statusConfig.color === "purple" ? "bg-purple-100 text-purple-700 hover:bg-purple-100" :
                      "bg-gray-100 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    Phương thức thanh toán
                  </p>
                  <p className="font-medium text-emerald-900">{getPaymentMethodLabel(order.paymentMethod)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Card - Right */}
        <div className="lg:col-span-1">
          <Card className="border-emerald-100 h-full sticky top-4">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
              <CardTitle className="text-emerald-900">Tóm tắt</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Số lượng sản phẩm</span>
                  <span className="font-medium text-emerald-900">
                    {order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tạm tính</span>
                  <span className="font-medium text-emerald-900">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phí vận chuyển</span>
                  <span className="font-medium text-emerald-600">Miễn phí</span>
                </div>
                <div className="border-t border-emerald-100 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-emerald-900">Tổng cộng</span>
                    <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 2: Order Items and Shipping Address - Same row, full width */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Order Items Card - Left */}
        <Card className="border-emerald-100">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <Package className="h-5 w-5" />
              Sản phẩm đơn hàng ({order.items?.length || 0} {order.items?.length === 1 ? "sản phẩm" : "sản phẩm"})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {order.items?.map((item) => (
                <OrderItemDetailCard key={item.id} item={item} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address Card - Right */}
        <Card className="border-emerald-100">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-2 text-emerald-900">
              <MapPin className="h-5 w-5" />
              Địa chỉ giao hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="font-semibold text-emerald-900">{order.shippingAddress.fullName}</p>
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.phoneNumber}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.addressLine}
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Order Status Bar - Full width, bottom */}
      <Card className="border-emerald-100">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <Receipt className="h-5 w-5" />
            Trạng thái đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <OrderStatusBar orderStatus={order.orderStatus} />
        </CardContent>
      </Card>
    </div>
  );
}

// Component to display order item with product image in detail page
function OrderItemDetailCard({ item }: { item: OrderItemDto }) {
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
    <div className="flex gap-4 p-4 rounded-lg">
      {/* Product Image */}
      <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-white">
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
            <Package className="h-8 w-8 text-emerald-300" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-emerald-900 mb-1 line-clamp-2">
          {item.productName || "Sản phẩm"}
        </p>
        {/* Variant Info */}
        {item.variantInfo && (
          <p className="text-xs text-emerald-700 mb-1">
            {item.variantInfo}
          </p>
        )}
        <p className="text-sm text-muted-foreground">
          Số lượng: {item.quantity}
        </p>
      </div>

      {/* Price */}
      <div className="text-right shrink-0">
        <p className="text-sm text-muted-foreground mb-1">
          {formatCurrency(item.unitPrice)} × {item.quantity}
        </p>
        <p className="font-bold text-lg text-emerald-600">
          {formatCurrency(item.lineTotal)}
        </p>
      </div>
    </div>
  );
}
