"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForgotPassword } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Mail, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useCooldown } from "@/lib/hooks/useCooldown";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const forgotPasswordMutation = useForgotPassword();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const cooldown = useCooldown();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await forgotPasswordMutation.mutateAsync(data);
    } catch (error: any) {
      // Rate limit: báo rõ và khóa nút theo Retry-After.
      if (cooldown.start(error)) {
        toast.error(error?.data?.message || "Bạn thao tác quá nhanh, vui lòng thử lại sau.");
        return;
      }
      // Các lỗi khác (kể cả email không tồn tại): KHÔNG tiết lộ, luôn hiện cùng một thông báo.
    }
    setIsSubmitted(true);
    setSubmittedEmail(data.email);
  };

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-[#f0fff5] via-white to-[#eefbf1]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,210,140,0.2),transparent_60%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,rgba(0,160,120,0.08),transparent_70%)] blur-3xl" />
      </div>

      <div className="container relative mx-auto min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-16">
        <Card className="relative z-10 w-full max-w-md border-emerald-100 shadow-[0_20px_60px_rgba(15,118,110,0.18)]">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-3xl text-emerald-950">
              Quên mật khẩu?
            </CardTitle>
            <CardDescription className="text-base text-emerald-900/80">
              {isSubmitted
                ? "Vui lòng kiểm tra email của bạn"
                : "Nhập email của bạn để nhận link đặt lại mật khẩu"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isSubmitted ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-900">
                        Yêu cầu đã được tiếp nhận
                      </p>
                      <p className="mt-1 text-sm text-emerald-800">
                        Nếu email{" "}
                        <span className="font-medium">{submittedEmail}</span>{" "}
                        tồn tại, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
                      </p>
                      <p className="mt-2 text-xs text-emerald-700">
                        💡 Nếu không thấy email, vui lòng kiểm tra thư mục spam.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={() => router.push("/login")}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Quay lại đăng nhập
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsSubmitted(false);
                      setSubmittedEmail(null);
                    }}
                    className="w-full border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                  >
                    Gửi lại email
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-600" />
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="your@email.com"
                      className="pl-10 border-emerald-200 focus:border-emerald-400"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={forgotPasswordMutation.isPending || cooldown.isCoolingDown}
                >
                  {forgotPasswordMutation.isPending
                    ? "Đang gửi..."
                    : cooldown.isCoolingDown
                      ? `Thử lại sau ${cooldown.secondsLeft}s`
                      : "Gửi link đặt lại mật khẩu"}
                </Button>
              </form>
            )}

            <div className="pt-4 border-t">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

