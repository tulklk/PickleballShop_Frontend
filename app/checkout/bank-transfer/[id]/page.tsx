"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BankTransferPayment } from "@/components/payment/BankTransferPayment";
import { BankTransferInfo } from "@/lib/api/types";
import { 
  CheckCircle2, 
  Package, 
  ArrowRight, 
  Clock,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { RequireAuth } from "@/lib/auth/guards";
import { DEBUG_API } from "@/lib/utils/debugApi";

interface BankTransferData {
  bankTransferInfo: BankTransferInfo;
  orderNumber: string;
  orderId: string;
}

export default function BankTransferSuccessPage() {
  return (
    <RequireAuth>
      <BankTransferSuccessContent />
    </RequireAuth>
  );
}

function BankTransferSuccessContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [bankTransferData, setBankTransferData] = useState<BankTransferData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState(15 * 60); // 15 minutes in seconds

  useEffect(() => {
    // Get bank transfer info from sessionStorage
    const storedData = sessionStorage.getItem(`bankTransfer_${orderId}`);
    if (storedData) {
      try {
        const data = JSON.parse(storedData) as BankTransferData;
        setBankTransferData(data);
      } catch (error) {
        if (DEBUG_API) {
          console.error("Failed to parse bank transfer data:", error);
        }
      }
    }
    setIsLoading(false);
  }, [orderId]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePaymentConfirmed = () => {
    toast.success("Cảm ơn bạn! Chúng tôi sẽ xác nhận thanh toán trong thời gian sớm nhất.");
    // Clean up sessionStorage
    sessionStorage.removeItem(`bankTransfer_${orderId}`);
    router.push(`/account/orders/${orderId}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  if (!bankTransferData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="border-amber-200">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 text-amber-500" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900">Không tìm thấy thông tin thanh toán</h2>
              <p className="text-muted-foreground mb-6">
                Thông tin chuyển khoản đã hết hạn hoặc không tồn tại.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => router.push(`/account/orders/${orderId}`)} variant="outline">
                  <Package className="h-4 w-4 mr-2" />
                  Xem đơn hàng
                </Button>
                <Button onClick={() => router.push("/products")}>
                  Tiếp tục mua sắm
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-4">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
          Đặt hàng thành công!
        </h1>
        <p className="text-muted-foreground">
          Mã đơn hàng: <span className="font-semibold text-gray-900">{bankTransferData.orderNumber}</span>
        </p>
      </div>

      {/* Countdown Timer */}
      {countdown > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-4">
              <Clock className="h-8 w-8 text-amber-600" />
              <div className="text-center">
                <p className="text-sm text-amber-700 font-medium">Vui lòng hoàn tất thanh toán trong</p>
                <p className="text-4xl font-bold text-amber-600 font-mono">{formatTime(countdown)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bank Transfer Payment Details */}
      <BankTransferPayment
        bankTransferInfo={bankTransferData.bankTransferInfo}
        orderNumber={bankTransferData.orderNumber}
        onPaymentConfirmed={handlePaymentConfirmed}
      />

      {/* Quick Actions */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link href={`/account/orders/${orderId}`}>
          <Button variant="outline" size="lg" className="w-full sm:w-auto border-emerald-300 text-emerald-700 hover:bg-emerald-50">
            <Package className="h-5 w-5 mr-2" />
            Xem chi tiết đơn hàng
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="ghost" size="lg" className="w-full sm:w-auto text-gray-600 hover:text-emerald-700">
            Tiếp tục mua sắm
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Help Text */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Nếu bạn gặp vấn đề khi thanh toán, vui lòng liên hệ hotline: <span className="font-semibold text-emerald-600">1900 xxxx</span>
        </p>
      </div>
    </div>
  );
}

