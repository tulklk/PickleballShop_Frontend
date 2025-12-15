"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Package, Home, ShoppingBag } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");
  const email = searchParams.get("email");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-emerald-200 shadow-xl">
        <CardContent className="pt-10 pb-8 px-8">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-emerald-800 mb-3">
              Đặt hàng thành công!
            </h1>

            {/* Description */}
            <p className="text-gray-600 mb-6">
              Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được tiếp nhận và đang được xử lý.
            </p>

            {/* Order Info */}
            <div className="bg-emerald-50 rounded-lg p-5 mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Package className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-800">Thông tin đơn hàng</span>
              </div>
              
              {orderNumber && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Mã đơn hàng</p>
                  <p className="text-xl font-bold text-emerald-700 font-mono">
                    {orderNumber}
                  </p>
                </div>
              )}

              {email && (
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <p className="text-sm text-gray-600">
                    Email xác nhận đã được gửi đến
                  </p>
                  <p className="text-sm font-medium text-emerald-700 mt-1">
                    {decodeURIComponent(email)}
                  </p>
                </div>
              )}
            </div>

            {/* Note */}
            <p className="text-sm text-gray-500 mb-8">
              Bạn sẽ thanh toán khi nhận hàng. Chúng tôi sẽ liên hệ với bạn sớm nhất có thể.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Home className="w-4 h-4 mr-2" />
                  Về trang chủ
                </Button>
              </Link>
              <Link href="/products">
                <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Tiếp tục mua sắm
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

