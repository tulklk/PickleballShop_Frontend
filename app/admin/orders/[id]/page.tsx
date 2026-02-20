"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAdminOrder, useAdminUpdateOrderStatus } from "@/lib/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateTime } from "@/lib/utils/formatDate";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { OrderStatus, PaymentStatus, PaymentMethod, OrderStatusLabels, normalizeOrderStatus } from "@/lib/api/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

function getOrderStatusText(status: OrderStatus | string): string {
  const normalizedStatus = normalizeOrderStatus(status);
  return OrderStatusLabels[normalizedStatus] || "Không xác định";
}

function getPaymentStatusText(status: PaymentStatus | string): string {
  // Handle string values from backend
  if (typeof status === "string") {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("pending") || statusLower.includes("chờ")) {
      return "Chờ thanh toán";
    }
    if (statusLower.includes("processing") || statusLower.includes("xử lý")) {
      return "Đang xử lý";
    }
    if (statusLower.includes("completed") || statusLower.includes("hoàn thành") || statusLower.includes("paid")) {
      return "Đã thanh toán";
    }
    if (statusLower.includes("failed") || statusLower.includes("thất bại")) {
      return "Thanh toán thất bại";
    }
    return status; // Return original string if no match
  }
  
  // Handle enum values
  switch (status) {
    case PaymentStatus.Pending:
      return "Chờ thanh toán";
    case PaymentStatus.Processing:
      return "Đang xử lý";
    case PaymentStatus.Completed:
      return "Đã thanh toán";
    case PaymentStatus.Failed:
      return "Thanh toán thất bại";
    default:
      return "Không xác định";
  }
}

function getPaymentMethodText(method: PaymentMethod | string | number | null | undefined): string {
  // Handle null/undefined
  if (method === null || method === undefined) {
    return "Không xác định";
  }
  
  // Handle string values from backend
  if (typeof method === "string") {
    const methodUpper = method.toUpperCase();
    if (methodUpper === "COD" || methodUpper.includes("COD")) {
      return "Thanh toán khi nhận hàng (COD)";
    }
    if (methodUpper === "MOMO" || methodUpper.includes("MOMO")) {
      return "MoMo";
    }
    if (methodUpper === "VNPAY" || methodUpper.includes("VNPAY")) {
      return "VNPay";
    }
    return method; // Return original string if no match
  }
  
  // Handle enum/number values
  if (typeof method === "number") {
    switch (method) {
      case 0:
      case PaymentMethod.COD:
        return "Thanh toán khi nhận hàng (COD)";
      case 1:
      case PaymentMethod.MoMo:
        return "MoMo";
      case 2:
      case PaymentMethod.VNPay:
        return "VNPay";
      default:
        return "Không xác định";
    }
  }
  
  // Handle enum values
  switch (method) {
    case PaymentMethod.COD:
      return "Thanh toán khi nhận hàng (COD)";
    case PaymentMethod.MoMo:
      return "MoMo";
    case PaymentMethod.VNPay:
      return "VNPay";
    default:
      return "Không xác định";
  }
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: order, isLoading, error } = useAdminOrder(orderId);
  const updateOrderStatus = useAdminUpdateOrderStatus();
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<OrderStatus | undefined>();

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrderStatus) return;

    try {
      // Convert enum to string for API (e.g., OrderStatus.Processing -> "Processing")
      const statusString = OrderStatus[selectedOrderStatus] as string;
      await updateOrderStatus.mutateAsync({
        id: orderId,
        data: { status: statusString },
      });
      toast.success("Cập nhật trạng thái đơn hàng thành công");
      setSelectedOrderStatus(undefined);
    } catch (error: any) {
      toast.error(error?.data?.message || "Không thể cập nhật trạng thái đơn hàng");
    }
  };

  // Debug logging - MUST be called before any early returns (Rules of Hooks)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[AdminOrderDetailPage] order:", order);
      console.log("[AdminOrderDetailPage] isLoading:", isLoading);
      console.log("[AdminOrderDetailPage] error:", error);
      console.log("[AdminOrderDetailPage] orderId:", orderId);
    }
  }, [order, isLoading, error, orderId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (error) {
    console.error("[AdminOrderDetailPage] Error details:", error);
    
    // Extract error message from ApiError if available
    let errorMessage = "Đã xảy ra lỗi không xác định";
    let errorDetails: any = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      // Check if it's an ApiError with status 500
      if ("status" in error && error.status === 500) {
        errorMessage = "Lỗi máy chủ (500). Vui lòng thử lại sau hoặc liên hệ quản trị viên.";
        if ("data" in error && error.data) {
          errorDetails = error.data;
        }
      } else if ("status" in error && error.status === 404) {
        errorMessage = "Không tìm thấy đơn hàng với ID này.";
      } else if ("status" in error && error.status === 403) {
        errorMessage = "Bạn không có quyền truy cập đơn hàng này.";
      } else if ("status" in error && error.status === 401) {
        errorMessage = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
      }
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 font-semibold mb-2">Không thể tải chi tiết đơn hàng</p>
            <p className="text-sm text-red-500 mb-2">{errorMessage}</p>
            {errorDetails && (
              <p className="text-xs text-red-400 mb-2">
                Chi tiết: {typeof errorDetails === "object" ? JSON.stringify(errorDetails) : String(errorDetails)}
              </p>
            )}
            {process.env.NODE_ENV === "development" && (
              <details className="mt-4">
                <summary className="text-xs text-red-600 cursor-pointer mb-2">Chi tiết lỗi (Development)</summary>
                <pre className="text-xs bg-red-100 p-2 rounded overflow-auto max-h-60">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </details>
            )}
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mr-2"
              >
                Tải lại trang
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
              >
                Quay lại
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 font-semibold mb-2">Không tìm thấy đơn hàng</p>
            <p className="text-sm text-red-500">
              Đơn hàng với ID: {orderId} không tồn tại hoặc bạn không có quyền truy cập.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Type guard: ensure order is defined before rendering
  if (!order) {
    return null;
  }

  // Sync dropdown with current order status (so it shows "Đã chuẩn bị hàng" when order is Prepared, etc.)
  const currentOrderStatus = normalizeOrderStatus(order.orderStatus);
  const displayStatus = selectedOrderStatus ?? currentOrderStatus;
  const hasStatusChange = selectedOrderStatus !== undefined && selectedOrderStatus !== currentOrderStatus;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Chi tiết đơn hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin đơn hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Mã đơn hàng</p>
              <p className="font-medium">{order.orderNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ngày đặt hàng</p>
              <p className="font-medium">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              <p className="font-medium">{getOrderStatusText(order.orderStatus)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái thanh toán</p>
              <p className="font-medium">{getPaymentStatusText(order.paymentStatus)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phương thức thanh toán</p>
              <p className="font-medium">{getPaymentMethodText(order.paymentMethod)}</p>
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
            <p className="font-medium">
              {order.user?.fullName || 
               order.shippingAddress?.fullName || 
               order.shippingFullName || 
               "N/A"}
            </p>
            <p className="text-muted-foreground">
              {order.user?.phoneNumber || 
               order.shippingAddress?.phoneNumber || 
               order.shippingPhoneNumber || 
               "N/A"}
            </p>
            <p className="text-muted-foreground">
              {order.shippingAddress?.addressLine || 
               order.shippingAddressLine || 
               "N/A"}
            </p>
            <p className="text-muted-foreground">
              {(() => {
                const ward = order.shippingAddress?.ward || order.shippingWard;
                const district = order.shippingAddress?.district || order.shippingDistrict;
                const city = order.shippingAddress?.city || order.shippingCity;
                return ward && district && city
                  ? `${ward}, ${district}, ${city}`
                  : "N/A";
              })()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Sản phẩm trong đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b pb-4"
                >
                  <div>
                    <p className="font-medium">{item.productName || "N/A"}</p>
                    {/* Variant Info */}
                    {item.variantInfo && (
                      <p className="text-xs text-muted-foreground">
                        📦 {item.variantInfo}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Số lượng: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(item.unitPrice)} x {item.quantity}
                    </p>
                    <p className="text-primary font-bold">
                      {formatCurrency(item.lineTotal)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">Không có sản phẩm nào</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cập nhật trạng thái đơn hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select
              value={displayStatus.toString()}
              onValueChange={(value) =>
                setSelectedOrderStatus(parseInt(value) as OrderStatus)
              }
            >
              {Object.entries(OrderStatusLabels).map(([value, label]) => {
                const statusValue = parseInt(value) as OrderStatus;
                return (
                  <SelectItem key={value} value={statusValue.toString()}>
                    {label}
                  </SelectItem>
                );
              })}
            </Select>
            <Button
              onClick={handleUpdateOrderStatus}
              disabled={!hasStatusChange || updateOrderStatus.isPending}
              className="w-full"
            >
              {updateOrderStatus.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Cập nhật trạng thái"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

