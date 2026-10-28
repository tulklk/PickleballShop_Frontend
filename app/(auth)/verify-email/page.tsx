"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useVerifyEmail, useResendVerificationEmail } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Mail, Loader2 } from "lucide-react";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
            <CardTitle className="text-center">Đang tải...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendVerificationEmail();
  const [isVerified, setIsVerified] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  const verifyEmail = async () => {
    if (!token || !email) return;

    try {
      await verifyMutation.mutateAsync({ token, email });
      setIsVerified(true);
      setIsError(false);
      toast.success("Xác thực email thành công!");
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      setIsError(true);
      // Thông báo chung: không tiết lộ email có tồn tại / đã xác thực hay chưa.
      toast.error(
        error?.status === 429
          ? error?.data?.message || "Bạn thao tác quá nhanh, vui lòng thử lại sau."
          : "Link xác thực không hợp lệ hoặc đã hết hạn. Bạn có thể yêu cầu gửi lại email xác thực."
      );
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (token && email) {
      verifyEmail();
    } else {
      setIsVerifying(false);
      setIsError(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, email]);

  const handleResend = async () => {
    if (!email) {
      toast.error("Không tìm thấy email để gửi lại");
      return;
    }

    try {
      await resendMutation.mutateAsync({ email });
    } catch (error: any) {
      if (error?.status === 429) {
        toast.error(error?.data?.message || "Bạn thao tác quá nhanh, vui lòng thử lại sau.");
        return;
      }
      // Không tiết lộ trạng thái tài khoản: luôn báo cùng một thông điệp.
    }
    toast.success("Nếu email hợp lệ, chúng tôi đã gửi email xác thực. Vui lòng kiểm tra hộp thư.");
  };

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-[#f1fff6] via-white to-[#e8fbf0]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(146,226,180,0.2),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(circle_at_bottom,rgba(45,181,138,0.12),transparent_55%)] blur-3xl" />
      </div>
      <div className="container relative mx-auto flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-16">
        <Card className="relative z-10 w-full max-w-md border-emerald-100 shadow-[0_20px_60px_rgba(15,118,110,0.18)]">
          <CardHeader className="space-y-2 text-center">
            {isVerifying && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-emerald-950">
                  Đang xác thực email...
                </CardTitle>
                <CardDescription className="text-base text-emerald-900/80">
                  Vui lòng đợi trong giây lát
                </CardDescription>
              </>
            )}

            {isVerified && !isVerifying && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <CardTitle className="text-2xl text-emerald-950">
                  Xác thực email thành công!
                </CardTitle>
                <CardDescription className="text-base text-emerald-900/80">
                  Tài khoản của bạn đã được xác thực. Đang chuyển đến trang đăng nhập...
                </CardDescription>
              </>
            )}

            {isError && !isVerifying && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-emerald-950">
                  Xác thực email thất bại
                </CardTitle>
                <CardDescription className="text-base text-emerald-900/80">
                  Link xác thực không hợp lệ hoặc đã hết hạn
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isError && !isVerifying && (
              <>
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-emerald-900">
                        Bạn chưa nhận được email?
                      </p>
                      <p className="mt-1 text-sm text-emerald-900/80">
                        Nhấn vào nút bên dưới để gửi lại email xác thực
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleResend}
                  disabled={resendMutation.isPending}
                  className="w-full"
                >
                  {resendMutation.isPending
                    ? "Đang gửi..."
                    : "Gửi lại email xác thực"}
                </Button>
                <Link href="/login">
                  <Button variant="outline" className="w-full">
                    Quay lại trang đăng nhập
                  </Button>
                </Link>
              </>
            )}

            {isVerified && !isVerifying && (
              <Link href="/login">
                <Button className="w-full">Đăng nhập ngay</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

