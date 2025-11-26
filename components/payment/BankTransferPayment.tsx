"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { BankTransferInfo } from "@/lib/api/types";
import { 
  Copy, 
  Check, 
  Download, 
  Building2, 
  CreditCard, 
  User, 
  Banknote, 
  FileText,
  AlertCircle,
  QrCode
} from "lucide-react";
import { toast } from "sonner";

interface BankTransferPaymentProps {
  bankTransferInfo: BankTransferInfo;
  orderNumber?: string;
  showCountdown?: boolean;
  countdownMinutes?: number;
  onPaymentConfirmed?: () => void;
}

export function BankTransferPayment({
  bankTransferInfo,
  orderNumber,
  showCountdown = false,
  countdownMinutes = 15,
  onPaymentConfirmed,
}: BankTransferPaymentProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(countdownMinutes * 60);

  // Countdown timer effect
  useState(() => {
    if (!showCountdown) return;
    
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`Đã sao chép ${fieldName}`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Không thể sao chép. Vui lòng thử lại.");
    }
  };

  const downloadQRCode = () => {
    if (!bankTransferInfo.qrDataUrl) return;
    
    const link = document.createElement("a");
    link.href = bankTransferInfo.qrDataUrl;
    link.download = `QR_${orderNumber || "payment"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Đã tải mã QR");
  };

  return (
    <div className="space-y-6">
      {/* Countdown Timer */}
      {showCountdown && countdown > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">
              Vui lòng hoàn tất thanh toán trong
            </p>
            <p className="text-2xl font-bold text-amber-600 font-mono">
              {formatTime(countdown)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <Card className="border-emerald-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-2 text-emerald-900 text-lg">
              <QrCode className="h-5 w-5" />
              Quét mã QR để thanh toán
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col items-center">
            {bankTransferInfo.qrDataUrl ? (
              <div className="relative">
                <div className="bg-white p-4 rounded-xl shadow-inner border-2 border-emerald-100">
                  <img
                    src={bankTransferInfo.qrDataUrl}
                    alt="QR Code thanh toán"
                    className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadQRCode}
                  className="mt-4 w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Tải mã QR
                </Button>
              </div>
            ) : (
              <div className="w-64 h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                <p className="text-gray-500 text-center">Không có mã QR</p>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Mở ứng dụng ngân hàng và quét mã QR để thanh toán
            </p>
          </CardContent>
        </Card>

        {/* Bank Transfer Details */}
        <Card className="border-emerald-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
            <CardTitle className="flex items-center gap-2 text-emerald-900 text-lg">
              <Building2 className="h-5 w-5" />
              Thông tin chuyển khoản
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* Bank Name */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <Building2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Ngân hàng</p>
                <p className="font-semibold text-gray-900">{bankTransferInfo.bankName}</p>
              </div>
            </div>

            {/* Account Number */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Số tài khoản</p>
                <p className="font-semibold text-gray-900 font-mono text-lg">{bankTransferInfo.accountNo}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankTransferInfo.accountNo, "số tài khoản")}
                className="flex-shrink-0 hover:bg-emerald-100"
              >
                {copiedField === "số tài khoản" ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>

            {/* Account Name */}
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Chủ tài khoản</p>
                <p className="font-semibold text-gray-900">{bankTransferInfo.accountName}</p>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <Banknote className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-emerald-700">Số tiền</p>
                <p className="font-bold text-emerald-700 text-xl">
                  {formatCurrency(bankTransferInfo.amount)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankTransferInfo.amount.toString(), "số tiền")}
                className="flex-shrink-0 hover:bg-emerald-100"
              >
                {copiedField === "số tiền" ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>

            {/* Transfer Content - Highlighted */}
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border-2 border-amber-300">
              <FileText className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-700 font-medium">Nội dung chuyển khoản (BẮT BUỘC)</p>
                <p className="font-bold text-amber-800 text-lg font-mono break-all">
                  {bankTransferInfo.transferContent}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(bankTransferInfo.transferContent, "nội dung chuyển khoản")}
                className="flex-shrink-0 hover:bg-amber-100"
              >
                {copiedField === "nội dung chuyển khoản" ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-gray-500" />
                )}
              </Button>
            </div>

            {/* Important Notice */}
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-700">
                <strong>Lưu ý quan trọng:</strong> Vui lòng nhập <strong>chính xác</strong> nội dung chuyển khoản để đơn hàng được xác nhận tự động.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Confirmed Button (Optional) */}
      {onPaymentConfirmed && (
        <div className="flex justify-center">
          <Button
            onClick={onPaymentConfirmed}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/30"
          >
            <Check className="h-5 w-5 mr-2" />
            Tôi đã thanh toán
          </Button>
        </div>
      )}
    </div>
  );
}

