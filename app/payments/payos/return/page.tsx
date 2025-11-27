"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Home, Package } from "lucide-react";

function PayOSReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "cancelled">("loading");
  const [orderCode, setOrderCode] = useState<string | null>(null);

  useEffect(() => {
    // Đọc query params từ PayOS
    const code = searchParams.get("code");
    const id = searchParams.get("id");
    const paymentStatus = searchParams.get("status");
    const orderCodeParam = searchParams.get("orderCode");
    const cancel = searchParams.get("cancel");

    console.log("PayOS return params:", { code, id, paymentStatus, orderCodeParam, cancel });

    setOrderCode(orderCodeParam);

    // Xác định trạng thái thanh toán
    if (cancel === "true") {
      setStatus("cancelled");
    } else if (paymentStatus === "PAID" || code === "00") {
      setStatus("success");
    } else {
      setStatus("failed");
    }
  }, [searchParams]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <div className="text-center py-12">
            <Loader2 className="h-16 w-16 mx-auto mb-4 text-emerald-500 animate-spin" />
            <h2 className="text-2xl font-bold mb-2 text-emerald-900">Đang xử lý...</h2>
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
                onClick={() => router.push("/account/orders")}
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
                onClick={() => router.push("/account/orders")}
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
              Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ.
            </p>
            {orderCode && (
              <p className="text-sm text-red-600 font-medium mb-6">
                Mã đơn hàng: {orderCode}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Button
                onClick={() => router.push("/account/orders")}
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
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
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
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
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

