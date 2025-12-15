"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileSearch, 
  Package, 
  Search, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle,
  ArrowRight,
  Hash
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { formatDateTime } from "@/lib/utils/formatDate";
import type { OrderDto } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";

function getStatusConfig(orderStatus: string | null) {
  if (!orderStatus) return { label: "Không xác định", color: "gray", icon: Clock };
  
  const status = orderStatus.toLowerCase();
  if (status.includes("completed") || status.includes("hoàn thành")) {
    return { label: "Hoàn thành", color: "emerald", icon: CheckCircle2 };
  }
  if (status.includes("pending") || status.includes("chờ")) {
    return { label: "Đang chờ xử lý", color: "amber", icon: Clock };
  }
  if (status.includes("processing") || status.includes("xử lý")) {
    return { label: "Đang xử lý", color: "blue", icon: Package };
  }
  if (status.includes("cancelled") || status.includes("hủy")) {
    return { label: "Đã hủy", color: "red", icon: XCircle };
  }
  if (status.includes("shipped") || status.includes("giao")) {
    return { label: "Đang giao hàng", color: "purple", icon: Truck };
  }
  return { label: orderStatus, color: "gray", icon: Clock };
}

function getPaymentStatusConfig(paymentStatus: string | null) {
  if (!paymentStatus) return { label: "Không xác định", color: "gray" };
  
  const status = paymentStatus.toLowerCase();
  if (status.includes("completed") || status.includes("paid") || status.includes("hoàn thành")) {
    return { label: "Đã thanh toán", color: "emerald" };
  }
  if (status.includes("pending") || status.includes("chờ")) {
    return { label: "Chờ thanh toán", color: "amber" };
  }
  if (status.includes("failed") || status.includes("thất bại")) {
    return { label: "Thanh toán thất bại", color: "red" };
  }
  return { label: paymentStatus, color: "gray" };
}

export default function OrderLookupPage() {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) {
      toast.error("Vui lòng nhập mã đơn hàng");
      return;
    }

    setIsLoading(true);
    setOrder(null);
    setNotFound(false);

    try {
      // Try to get order by order number using the status endpoint
      const response = await apiClient.getGuestOrderByNumber(orderNumber.trim());
      
      if (response) {
        setOrder(response);
      } else {
        setNotFound(true);
      }
    } catch (error: any) {
      console.error("Order lookup error:", error);
      if (error?.status === 404) {
        setNotFound(true);
      } else {
        toast.error(error?.data?.message || "Không thể tra cứu đơn hàng. Vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const statusConfig = order ? getStatusConfig(order.orderStatus) : null;
  const paymentConfig = order ? getPaymentStatusConfig(order.paymentStatus) : null;
  const StatusIcon = statusConfig?.icon || Clock;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <FileSearch className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-emerald-900 mb-2">
          Tra cứu đơn hàng
        </h1>
        <p className="text-gray-600">
          Nhập mã đơn hàng để kiểm tra trạng thái đơn hàng của bạn
        </p>
      </div>

      {/* Search Form */}
      <div className="max-w-md mx-auto mb-8">
        <form onSubmit={handleLookup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orderNumber" className="flex items-center gap-2 text-emerald-900">
              <Hash className="h-4 w-4" />
              Mã đơn hàng <span className="text-red-500">*</span>
            </Label>
            <Input
              id="orderNumber"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Ví dụ: ORD-20251215-B832A195"
              className="border-emerald-200 focus:border-emerald-500 h-12"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tra cứu...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Tra cứu đơn hàng
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Not Found Message */}
      {notFound && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Không tìm thấy đơn hàng
              </h3>
              <p className="text-amber-700 text-sm">
                Mã đơn hàng &quot;{orderNumber}&quot; không tồn tại. Vui lòng kiểm tra lại mã đơn hàng trong email xác nhận.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Details */}
      {order && (
        <div className="max-w-md mx-auto space-y-6">
          {/* Order Header */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-emerald-900 mb-2">
              <Package className="h-5 w-5" />
              <span className="font-semibold">Đơn hàng: {order.orderNumber}</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Ngày đặt: {formatDateTime(order.createdAt)}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge 
                style={{
                  backgroundColor: statusConfig?.color === 'emerald' ? '#d1fae5' : 
                                  statusConfig?.color === 'amber' ? '#fef3c7' :
                                  statusConfig?.color === 'blue' ? '#dbeafe' :
                                  statusConfig?.color === 'purple' ? '#f3e8ff' :
                                  statusConfig?.color === 'red' ? '#fee2e2' : '#f3f4f6',
                  color: statusConfig?.color === 'emerald' ? '#065f46' : 
                         statusConfig?.color === 'amber' ? '#92400e' :
                         statusConfig?.color === 'blue' ? '#1e40af' :
                         statusConfig?.color === 'purple' ? '#6b21a8' :
                         statusConfig?.color === 'red' ? '#991b1b' : '#374151'
                }}
              >
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig?.label}
              </Badge>
              <Badge 
                variant="outline"
                style={{
                  backgroundColor: paymentConfig?.color === 'emerald' ? '#d1fae5' : 
                                  paymentConfig?.color === 'amber' ? '#fef3c7' :
                                  paymentConfig?.color === 'red' ? '#fee2e2' : '#f3f4f6',
                  color: paymentConfig?.color === 'emerald' ? '#065f46' : 
                         paymentConfig?.color === 'amber' ? '#92400e' :
                         paymentConfig?.color === 'red' ? '#991b1b' : '#374151',
                  borderColor: paymentConfig?.color === 'emerald' ? '#a7f3d0' : 
                               paymentConfig?.color === 'amber' ? '#fcd34d' :
                               paymentConfig?.color === 'red' ? '#fca5a5' : '#e5e7eb'
                }}
              >
                {paymentConfig?.label}
              </Badge>
            </div>
          </div>

          {/* Continue Shopping */}
          <div className="pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => router.push("/products")}
              className="w-full"
            >
              Tiếp tục mua sắm
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

