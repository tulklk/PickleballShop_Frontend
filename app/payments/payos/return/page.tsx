"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Home, Package } from "lucide-react";
import { apiClient } from "@/lib/api/client";

interface PayOSConfirmResponse {
  success: boolean;
  message: string;
  orderId?: string;
}

function PayOSReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "cancelled">("loading");
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");

  const confirmPayment = useCallback(async (params: {
    code: string;
    id: string;
    cancel: boolean;
    status: string;
    orderCode: number;
    orderId?: string;
  }) => {
    try {
      const token = apiClient.getAccessToken();
      console.log("Calling PayOS confirm API with token:", token ? "Yes" : "No");
      console.log("PayOS confirm request body:", params);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://pickleballshop-backend.fly.dev"}/api/payments/payos/confirm`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && {
              Authorization: `Bearer ${token}`,
            }),
          },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || "Lỗi xác nhận thanh toán" };
        }
        console.error("PayOS confirm error:", errorData);
        return {
          success: false,
          message: errorData.message || "Lỗi xác nhận thanh toán",
          orderId: undefined,
        } as PayOSConfirmResponse;
      }

      const data: PayOSConfirmResponse = await response.json();
      console.log("PayOS confirm response:", data);

      if (data.orderId) {
        setOrderId(data.orderId);
      }
      setMessage(data.message || "");

      return data;
    } catch (error) {
      console.error("Error confirming PayOS payment:", error);
      return {
        success: false,
        message: "Lỗi kết nối đến server. Vui lòng thử lại sau.",
        orderId: undefined,
      } as PayOSConfirmResponse;
    }
  }, []);

  useEffect(() => {
    const processPayment = async () => {
      // Đọc query params từ PayOS
      const code = searchParams.get("code") || "";
      const id = searchParams.get("id") || "";
      const paymentStatus = searchParams.get("status") || "";
      const orderCodeParam = searchParams.get("orderCode") || "";
      const cancel = searchParams.get("cancel");
      // Lấy orderId từ sessionStorage nếu có (được lưu khi tạo order)
      let savedOrderId: string | undefined = sessionStorage.getItem("payos_orderId") || undefined;
      if (savedOrderId) {
        savedOrderId = savedOrderId.trim();
        if (savedOrderId === "" || savedOrderId === "null" || savedOrderId === "undefined") {
          savedOrderId = undefined;
        }
      }

      console.log("PayOS return params:", { code, id, paymentStatus, orderCodeParam, cancel, savedOrderId });

      setOrderCode(orderCodeParam);

      // Gọi API confirm payment với orderId nếu có
      // Backend có thể tìm order dựa trên orderCode nếu không có orderId
      const confirmResult = await confirmPayment({
        code,
        id,
        cancel: cancel === "true",
        status: paymentStatus,
        orderCode: parseInt(orderCodeParam) || 0,
        orderId: savedOrderId,
      });
      
      // Xóa orderId khỏi sessionStorage sau khi confirm
      sessionStorage.removeItem("payos_orderId");

      // Xác định trạng thái thanh toán dựa trên cả PayOS params và backend response
      if (cancel === "true") {
        setStatus("cancelled");
      } else if (paymentStatus === "PAID" || code === "00") {
        // Chỉ hiển thị success nếu backend confirm thành công
        if (confirmResult?.success === true) {
          setStatus("success");
          if (confirmResult.orderId) {
            setOrderId(confirmResult.orderId);
          }
        } else {
          // PayOS thành công nhưng backend confirm thất bại
          setStatus("failed");
          setMessage(confirmResult?.message || "Thanh toán thành công nhưng xác nhận đơn hàng thất bại. Vui lòng liên hệ hỗ trợ.");
        }
      } else {
        setStatus("failed");
        if (confirmResult?.message) {
          setMessage(confirmResult.message);
        }
      }
    };

    processPayment();
  }, [searchParams, confirmPayment]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-emerald-500 animate-spin" />
            <h2 className="text-2xl font-bold mb-2 text-emerald-900">Đang xác nhận thanh toán...</h2>
            <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
          </div>
        );

      case "success":
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-emerald-900">Thanh toán thành công!</h2>
            <p className="text-muted-foreground mb-2">
              Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đang được xử lý.
            </p>
            {orderCode && (
              <p className="text-sm text-emerald-600 font-medium mb-6">
                Mã đơn hàng: {orderCode}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button
                onClick={() => router.push(orderId ? `/account/orders/${orderId}` : "/account/orders")}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Package className="mr-2 h-4 w-4" />
                Xem đơn hàng
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
            </div>
          </div>
        );

      case "cancelled":
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-yellow-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-yellow-900">Thanh toán đã bị hủy</h2>
            <p className="text-muted-foreground mb-6">
              Bạn đã hủy giao dịch thanh toán. Đơn hàng vẫn được lưu và bạn có thể thanh toán lại sau.
            </p>
            {orderCode && (
              <p className="text-sm text-yellow-600 font-medium mb-6">
                Mã đơn hàng: {orderCode}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button
                onClick={() => router.push(orderId ? `/account/orders/${orderId}` : "/account/orders")}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                <Package className="mr-2 h-4 w-4" />
                Xem đơn hàng
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
              >
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
            </div>
          </div>
        );

      case "failed":
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h2 className="text-3xl font-bold mb-2 text-red-900">Thanh toán thất bại</h2>
            <p className="text-muted-foreground mb-6">
              {message || "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ."}
            </p>
            {orderCode && (
              <p className="text-sm text-red-600 font-medium mb-6">
                Mã đơn hàng: {orderCode}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button
                onClick={() => router.push(orderId ? `/account/orders/${orderId}` : "/account/orders")}
                className="bg-red-600 hover:bg-red-700"
              >
                <Package className="mr-2 h-4 w-4" />
                Xem đơn hàng
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="border-red-200 text-red-700 hover:bg-red-50"
              >
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="border-emerald-100 shadow-lg">
        <CardHeader className="bg-linear-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
          <CardTitle className="text-center text-emerald-900">
            Kết quả thanh toán PayOS
          </CardTitle>
        </CardHeader>
        <CardContent>{renderContent()}</CardContent>
      </Card>
    </div>
  );
}

export default function PayOSReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-emerald-100 shadow-lg">
            <CardHeader className="bg-linear-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
              <CardTitle className="text-center text-emerald-900">
                Kết quả thanh toán PayOS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Loader2 className="h-16 w-16 mx-auto mb-4 text-emerald-500 animate-spin" />
                <h2 className="text-2xl font-bold mb-2 text-emerald-900">Đang xử lý...</h2>
                <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PayOSReturnContent />
    </Suspense>
  );
}
