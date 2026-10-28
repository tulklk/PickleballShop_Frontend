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
  Hash,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { formatDateTime } from "@/lib/utils/formatDate";
import type { OrderDto } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { DEBUG_API } from "@/lib/utils/debugApi";
import { useCooldown } from "@/lib/hooks/useCooldown";
import { isValidEmail } from "@/lib/utils/orderPayload";

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
  const [email, setEmail] = useState("");
  const cooldown = useCooldown();
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<OrderDto | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim();
    const cleanOrderNumber = orderNumber.trim();

    // Backend yêu cầu CẢ email và mã đơn (không còn tra cứu danh sách đơn theo email).
    if (!isValidEmail(cleanEmail)) {
      toast.error("Vui lòng nhập email đã dùng khi đặt hàng");
      return;
    }
    if (!cleanOrderNumber) {
      toast.error("Vui lòng nhập mã đơn hàng");
      return;
    }

    setIsLoading(true);
    setOrder(null);
    setNotFound(false);

    try {
      const results = await apiClient.lookupGuestOrder({
        email: cleanEmail,
        orderNumber: cleanOrderNumber,
      });
      // Kết quả chỉ có tối đa 1 đơn.
      if (results.length > 0) {
        setOrder(results[0]);
      } else {
        setNotFound(true);
      }
    } catch (error: any) {
      if (DEBUG_API) {
        console.error("Order lookup error:", error);
      }
      if (cooldown.start(error)) {
        toast.error(error?.data?.message || "Bạn thao tác quá nhanh, vui lòng thử lại sau.");
      } else if (error?.status === 404) {
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
    <div className="min-h-[calc(100vh-200px)] bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
            <FileSearch className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900 mb-2">
            Tra cứu đơn hàng
          </h1>
          <p className="text-sm sm:text-base text-gray-600 px-4">
            Nhập email đặt hàng và mã đơn hàng để kiểm tra trạng thái đơn hàng của bạn
          </p>
        </div>

        {/* Search Form */}
        <div className="max-w-md mx-auto mb-6 sm:mb-8 px-2 sm:px-0">
          <form onSubmit={handleLookup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2 text-emerald-900 text-sm sm:text-base">
                <Mail className="h-4 w-4" />
                Email đặt hàng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="border-emerald-200 focus:border-emerald-500 h-11 sm:h-12 text-sm sm:text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orderNumber" className="flex items-center gap-2 text-emerald-900 text-sm sm:text-base">
                <Hash className="h-4 w-4" />
                Mã đơn hàng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="orderNumber"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="VD: ORD-20251215-B832A195"
                className="border-emerald-200 focus:border-emerald-500 h-11 sm:h-12 text-sm sm:text-base"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 h-11 sm:h-12 text-sm sm:text-base"
              disabled={isLoading || cooldown.isCoolingDown}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tra cứu...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  {cooldown.isCoolingDown ? `Thử lại sau ${cooldown.secondsLeft}s` : "Tra cứu đơn hàng"}
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Not Found Message */}
        {notFound && (
          <div className="max-w-md mx-auto px-2 sm:px-0">
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6 pb-6">
                <div className="text-center">
                  <div className="mx-auto w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                    <XCircle className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-amber-900 mb-2">
                    Không tìm thấy đơn hàng
                  </h3>
                  <p className="text-amber-700 text-xs sm:text-sm px-2">
                    Không tìm thấy đơn hàng khớp với email và mã đơn hàng đã nhập. Vui lòng kiểm tra lại thông tin trong email xác nhận.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="max-w-md mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Order Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
              {/* Order Header */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-900 mb-2">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="font-semibold text-sm sm:text-base">Đơn hàng: {order.orderNumber}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mb-4">
                  Ngày đặt: {formatDateTime(order.createdAt)}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Badge 
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1"
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
                    className="text-xs sm:text-sm px-2 sm:px-3 py-1"
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
            </div>

            {/* Continue Shopping */}
            <Button
              variant="outline"
              onClick={() => router.push("/products")}
              className="w-full h-11 sm:h-12 text-sm sm:text-base"
            >
              Tiếp tục mua sắm
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

