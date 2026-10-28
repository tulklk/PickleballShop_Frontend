"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Home, Package, Mail } from "lucide-react";
import { useUserMe } from "@/lib/api/hooks";
import { apiClient } from "@/lib/api/client";
import { derivePayosHint, isValidOrderId } from "@/lib/utils/paymentStatus";
import { confirmPayosWithRetry, parseOrderCode } from "@/lib/utils/payosConfirm";

function PayOSReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: userMe } = useUserMe();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "cancelled" | "pending">("loading");
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [failTitle, setFailTitle] = useState<string>("Thanh toán thất bại");
  const [isGuestOrder, setIsGuestOrder] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    const readStoredId = (key: string): string | null => {
      const v = sessionStorage.getItem(key);
      return isValidOrderId(v) ? v.trim() : null;
    };

    const processPayment = async () => {
      const errorMessage = searchParams.get("message");
      const rawOrderCode = searchParams.get("orderCode");
      setOrderCode((rawOrderCode || "").slice(0, 32));

      // orderId chỉ được tin khi đúng định dạng UUID (tránh chèn path lạ vào router.push).
      const orderIdParam =
        searchParams.get("orderId") ||
        searchParams.get("savedOrderId") ||
        searchParams.get("id") ||
        "";
      const finalOrderId: string | null = isValidOrderId(orderIdParam)
        ? orderIdParam.trim()
        : readStoredId("payos_orderId");

      if (finalOrderId) setOrderId(finalOrderId);

      const guestOrderId = sessionStorage.getItem("guest_orderId");
      const isGuest = !!guestOrderId && guestOrderId === finalOrderId;
      if (isGuest) setIsGuestOrder(true);

      // Query string chỉ là "gợi ý" (có thể bị giả mạo). Trạng thái thật do POST /payments/payos/confirm quyết định.
      const hint = derivePayosHint(searchParams);

      const code = parseOrderCode(rawOrderCode);
      if (code === null) {
        setFailTitle("Thiếu thông tin giao dịch");
        setMessage("Liên kết thanh toán không hợp lệ (thiếu mã giao dịch).");
        setStatus("failed");
        return;
      }

      const outcome = await confirmPayosWithRetry({
        confirm: (data) => apiClient.confirmPayosPayment(data),
        orderCode: code,
        orderId: finalOrderId ?? undefined,
        hint,
        isCancelled: () => cancelled,
      });
      if (cancelled) return;

      switch (outcome.kind) {
        case "success":
          setStatus("success");
          sessionStorage.removeItem("payos_orderId");
          sessionStorage.removeItem("guest_orderId");
          break;
        case "cancelled":
          setStatus("cancelled");
          sessionStorage.removeItem("payos_orderId");
          break;
        case "notPaid":
          setFailTitle("Thanh toán chưa thành công");
          setMessage(
            (outcome.message || errorMessage || "").slice(0, 200) ||
              "Hệ thống chưa ghi nhận thanh toán cho đơn hàng này. Nếu bạn đã chuyển tiền, vui lòng liên hệ hỗ trợ."
          );
          setStatus("failed");
          break;
        case "forbidden":
          setFailTitle("Không thể xem đơn hàng này");
          setMessage("Đơn hàng này không thuộc về tài khoản của bạn. Vui lòng đăng nhập đúng tài khoản đã đặt hàng.");
          setStatus("failed");
          break;
        case "notFound":
          setFailTitle("Không tìm thấy giao dịch");
          setMessage("Không tìm thấy đơn hàng ứng với giao dịch này. Vui lòng kiểm tra lại hoặc liên hệ hỗ trợ.");
          setStatus("failed");
          break;
        case "rateLimited":
          setMessage("Bạn thao tác quá nhanh, hệ thống chưa thể xác nhận thanh toán. Vui lòng tải lại trang sau ít phút.");
          setStatus("pending");
          break;
        default:
          setMessage("Chưa thể xác nhận thanh toán do lỗi hệ thống. Vui lòng kiểm tra lại đơn hàng sau ít phút.");
          setStatus("pending");
      }
    };

    processPayment();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

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

      case "pending":
        return (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-amber-900">Đang chờ xác nhận thanh toán</h2>
            <p className="text-muted-foreground mb-6">
              {message ||
                "Hệ thống chưa nhận được xác nhận cuối cùng từ cổng thanh toán. Trạng thái đơn hàng sẽ tự cập nhật, bạn có thể kiểm tra lại trong mục đơn hàng sau ít phút."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              {!isGuestOrder && (
                <Button
                  onClick={() => router.push(orderId ? `/account/orders/${orderId}` : "/account/orders")}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Xem đơn hàng
                </Button>
              )}
              {isGuestOrder && (
                <Button onClick={() => router.push("/order-lookup")} className="bg-amber-600 hover:bg-amber-700">
                  <Package className="mr-2 h-4 w-4" />
                  Tra cứu đơn hàng
                </Button>
              )}
              <Button variant="outline" onClick={() => router.push("/")} className="border-amber-200 text-amber-700 hover:bg-amber-50">
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
            </div>
          </div>
        );

      case "success":
        const userEmail = userMe?.email || "";
        return (
          <div className="mx-auto max-w-xl text-center py-10 px-4 sm:px-8">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-emerald-900">Thanh toán thành công!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Cảm ơn bạn đã thanh toán. Đơn hàng của bạn đang được xử lý.
            </p>

            <div className="mt-6 space-y-4 text-left">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900">Email xác nhận đã được gửi</p>
                    <p className="text-xs text-emerald-700">
                      Đến: <span className="font-medium">{userEmail || "Email bạn đăng ký"}</span>
                    </p>
                    <p className="mt-1 text-xs text-emerald-700/80">
                      Nếu chưa thấy email, vui lòng kiểm tra Spam/Junk.
                    </p>
                  </div>
                </div>
              </div>

              {(orderCode || orderId) && (
                <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm">
                  {orderCode && (
                    <div className="flex items-center justify-between text-sm text-emerald-900">
                      <span className="text-muted-foreground">Mã đơn PayOS:</span>
                      <span className="font-semibold">{orderCode}</span>
                    </div>
                  )}
                  {orderId && (
                    <div className="mt-2 flex items-center justify-between text-xs text-emerald-800">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-mono">{orderId}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {isGuestOrder ? (
                <>
                  <Button
                    onClick={() => router.push("/")}
                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Về trang chủ
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/products")}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 w-full"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Tiếp tục mua sắm
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => router.push(orderId ? `/account/orders/${orderId}` : "/account/orders")}
                    className="bg-emerald-600 hover:bg-emerald-700 w-full"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Xem đơn hàng
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 w-full"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Về trang chủ
                  </Button>
                </>
              )}
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
            {/* Order Info */}
            {(orderCode || orderId) && (
              <div className="mx-auto max-w-md mt-4 mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                {orderCode && (
                  <p className="text-sm text-yellow-700 font-medium mb-1">
                    Mã đơn hàng PayOS: <span className="font-semibold">{orderCode}</span>
                  </p>
                )}
                {orderId && (
                  <p className="text-xs text-yellow-600">
                    Order ID: <span className="font-mono">{orderId}</span>
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              {!isGuestOrder && orderId && (
                <Button
                  onClick={() => router.push(`/account/orders/${orderId}`)}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Xem đơn hàng
                </Button>
              )}
              {!isGuestOrder && !orderId && (
                <Button
                  onClick={() => router.push("/account/orders")}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Xem đơn hàng
                </Button>
              )}
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
            <h2 className="text-3xl font-bold mb-2 text-red-900">{failTitle}</h2>
            <p className="text-muted-foreground mb-6">
              {message || "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại hoặc liên hệ hỗ trợ."}
            </p>
            {/* Order Info */}
            {(orderCode || orderId) && (
              <div className="mx-auto max-w-md mt-4 mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                {orderCode && (
                  <p className="text-sm text-red-700 font-medium mb-1">
                    Mã đơn hàng PayOS: <span className="font-semibold">{orderCode}</span>
                  </p>
                )}
                {orderId && (
                  <p className="text-xs text-red-600">
                    Order ID: <span className="font-mono">{orderId}</span>
                  </p>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              {!isGuestOrder && orderId && (
                <Button
                  onClick={() => router.push(`/account/orders/${orderId}`)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Xem đơn hàng
                </Button>
              )}
              {!isGuestOrder && !orderId && (
                <Button
                  onClick={() => router.push("/account/orders")}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Package className="mr-2 h-4 w-4" />
                  Xem đơn hàng
                </Button>
              )}
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
