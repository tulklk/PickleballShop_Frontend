"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRegister, useResendVerificationEmail } from "@/lib/api/hooks";
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
import { ArrowRight, BadgeCheck, HeartHandshake, Mail } from "lucide-react";
import { useState } from "react";

const registerSchema = z
  .object({
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
    fullName: z.string().min(2, "Họ và tên là bắt buộc"),
    phoneNumber: z.string().min(10, "Số điện thoại phải có ít nhất 10 số"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = useRegister();
  const resendVerificationMutation = useResendVerificationEmail();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const response = await registerMutation.mutateAsync(data);
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }
      setRegisteredEmail(data.email); // Store email for resend verification
      toast.success("Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
      // Don't redirect immediately, show message that email verification is required
      // User should check their email
    } catch (error: any) {
      const errorMessage = error?.data?.message || "Đăng ký thất bại";
      setRegisteredEmail(null);
      // Check if error is about email already exists or other validation
      if (errorMessage.toLowerCase().includes("email") || errorMessage.toLowerCase().includes("đã tồn tại")) {
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const handleResendVerification = async () => {
    if (!registeredEmail) return;

    try {
      await resendVerificationMutation.mutateAsync({ email: registeredEmail });
      toast.success("Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư của bạn.");
    } catch (error: any) {
      toast.error(
        error?.data?.message || "Gửi lại email xác thực thất bại. Vui lòng thử lại."
      );
    }
  };

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-[#f1fff6] via-white to-[#e8fbf0]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(146,226,180,0.2),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(circle_at_bottom,rgba(45,181,138,0.12),transparent_55%)] blur-3xl" />
      </div>
      <div className="container relative mx-auto grid min-h-[calc(100vh-140px)] items-center gap-12 px-4 py-16 lg:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-1 text-sm font-semibold text-emerald-600 shadow-sm">
            <BadgeCheck className="h-4 w-4 text-emerald-500" />
            Thành viên IKA Sport
          </span>
          <div>
            <h1 className="text-4xl font-bold text-emerald-950 md:text-5xl">
              Tạo tài khoản & mở khóa ưu đãi dành riêng cho bạn
            </h1>
            <p className="mt-4 text-lg text-emerald-900/80 max-w-2xl">
              Nhận gợi ý paddle theo trình độ, tích điểm mua sắm và cập nhật
              nhanh các giải đấu Pickleball trên khắp Việt Nam.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              "Ưu đãi sinh nhật & thành viên thân thiết.",
              "Giao nhanh nội thành & đổi trả dễ dàng.",
              "Tư vấn paddle 1:1 cùng chuyên gia IKA.",
              "Nhận vé mời workshop / tour demo.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-emerald-100 bg-white/80 p-4 text-sm font-medium text-emerald-900 shadow-[0_12px_30px_rgba(15,118,110,0.08)]"
              >
                <span className="mr-2 text-emerald-500">•</span>
                {item}
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-[0_20px_50px_rgba(15,118,110,0.12)] backdrop-blur">
            <p className="text-lg font-semibold text-emerald-900">
              Ưu đãi dành cho thành viên mới
            </p>
            <p className="mt-2 text-sm text-emerald-900/80">
              Giảm ngay 10% set paddle + ball trong 7 ngày đầu tiên sau khi bạn
              đăng ký tài khoản. Áp dụng tự động khi đăng nhập.
            </p>
            <div className="mt-3 inline-flex items-center text-sm font-semibold text-emerald-600">
              Liên hệ đội ngũ chăm sóc <HeartHandshake className="ml-2 h-4 w-4" />
            </div>
          </div>
        </div>

        <Card className="relative z-10 w-full border-emerald-100 shadow-[0_20px_60px_rgba(15,118,110,0.18)]">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl text-emerald-950">
              Tạo tài khoản
            </CardTitle>
            <CardDescription className="text-base text-emerald-900/80">
              Điền thông tin để gia nhập cộng đồng Pickleball của IKA
            </CardDescription>
          </CardHeader>
          <CardContent>
            {registeredEmail && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-emerald-900">
                      Đăng ký thành công!
                    </p>
                    <p className="mt-1 text-sm text-emerald-800">
                      Chúng tôi đã gửi email xác thực đến <span className="font-medium">{registeredEmail}</span>. 
                      Vui lòng kiểm tra hộp thư và nhấp vào link để xác thực tài khoản.
                    </p>
                    <div className="mt-3">
                      <Button
                        type="button"
                        onClick={handleResendVerification}
                        disabled={resendVerificationMutation.isPending}
                        size="sm"
                        variant="outline"
                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                      >
                        {resendVerificationMutation.isPending
                          ? "Đang gửi..."
                          : "Gửi lại email xác thực"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  placeholder="Nhập họ và tên"
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="Nhập email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Số điện thoại</Label>
                <Input
                  id="phoneNumber"
                  {...register("phoneNumber")}
                  placeholder="Nhập số điện thoại"
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="Nhập mật khẩu"
                />
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword")}
                  placeholder="Nhập lại mật khẩu"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending
                  ? "Đang tạo tài khoản..."
                  : "Đăng ký"}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-emerald-900/80">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-800"
              >
                Đăng nhập ngay
                <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

