"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Home, Package, Mail } from "lucide-react";
import { useUserMe } from "@/lib/api/hooks";

function VNPayReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: userMe } = useUserMe();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const vnp_ResponseCode = searchParams.get("vnp_ResponseCode");
    if (vnp_ResponseCode === "00") {
      setStatus("success");
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  const userEmail = userMe?.email || "";

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-2xl border-emerald-100 shadow-lg">
        <CardHeader className="bg-linear-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
          <CardTitle className="text-center text-emerald-900">
            {status === "loading" && "Đang xử lý thanh toán..."}
            {status === "success" && "Thanh toán thành công"}
            {status === "error" && "Thanh toán thất bại"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center py-8">
          {status === "loading" && (
            <div className="py-12">
              <Loader2 className="mx-auto h-16 w-16 text-emerald-500 animate-spin mb-4" />
              <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
            </div>
          )}
          {status === "success" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-emerald-900">Thanh toán thành công!</h2>
              <p className="text-muted-foreground mb-4">
                Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đang được xử lý.
              </p>
              
              {/* Email confirmation notification */}
              <div className="mx-auto max-w-md mt-4 mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-emerald-900 mb-1">
                      Email xác nhận đã được gửi
                    </p>
                    {userEmail && (
                      <p className="text-xs text-emerald-700 mb-2">
                        Đến: <span className="font-medium">{userEmail}</span>
                      </p>
                    )}
                    <p className="text-xs text-emerald-600">
                      💡 Lưu ý: Nếu không thấy email trong hộp thư đến, vui lòng kiểm tra thư mục Spam/Junk.
                    </p>
                  </div>
                </div>
              </div>

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
            </>
          )}
          {status === "error" && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-red-900">Thanh toán thất bại</h2>
              <p className="text-muted-foreground mb-6">
                Thanh toán không thể được xử lý. Vui lòng thử lại.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => router.push("/checkout")}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Thử lại
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
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function VNPayReturnPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center">Processing payment...</div>}>
      <VNPayReturnContent />
    </Suspense>
  );
}

