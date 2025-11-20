"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { useLogin, useGoogleAuthLogin } from "@/lib/api/hooks";
import { useAuth } from "@/lib/auth/useAuth";
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
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const communityStats = [
  { label: "Paddle đã giao", value: "12K+" },
  { label: "CLB đồng hành", value: "180+" },
  { label: "Khách hàng hài lòng", value: "4.9/5" },
];

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = useLogin();
  const googleLoginMutation = useGoogleAuthLogin();
  const { isAdmin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await loginMutation.mutateAsync(data);
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }
      toast.success("Login successful!");
      router.push(isAdmin ? "/admin" : "/");
    } catch (error: any) {
      toast.error(error?.data?.message || "Login failed");
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      toast.error("Không nhận được thông tin từ Google.");
      return;
    }

    try {
      const response = await googleLoginMutation.mutateAsync(
        credentialResponse.credential
      );
      if (response.refreshToken) {
        localStorage.setItem("refreshToken", response.refreshToken);
      }
      toast.success("Đăng nhập Google thành công!");
      router.push(isAdmin ? "/admin" : "/");
    } catch (error: any) {
      toast.error(error?.data?.message || "Google login failed");
    }
  };

  const isSubmitting =
    loginMutation.isPending || googleLoginMutation.isPending;

  const handleGoogleError = () => {
    toast.error("Google login failed. Please try again.");
  };

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-[#f0fff5] via-white to-[#eefbf1]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(86,210,140,0.2),transparent_60%)]" />
        <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,rgba(0,160,120,0.08),transparent_70%)] blur-3xl" />
      </div>

      <div className="container relative mx-auto grid min-h-[calc(100vh-140px)] items-center gap-12 px-4 py-16 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-1 text-sm font-semibold text-emerald-600 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            Tài khoản chuyên dụng Pickleball
          </span>
          <div>
            <h1 className="text-4xl font-bold text-emerald-950 md:text-5xl">
              Đăng nhập nhanh để tiếp tục hành trình Pickleball
            </h1>
            <p className="mt-4 text-lg text-emerald-900/80 max-w-2xl">
              Đồng bộ đơn hàng, theo dõi lịch sử mua sắm và nhận ưu đãi từ hệ
              sinh thái IKA Sport chỉ với một lần đăng nhập.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Sparkles,
                title: "Ưu đãi theo cấp độ",
                desc: "Combo paddle, ball và trang phục dành riêng từng trình độ.",
              },
              {
                icon: Trophy,
                title: "Theo dõi giải đấu",
                desc: "Nhận thông báo sự kiện & workshop Pickleball gần bạn.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-emerald-100 bg-white/80 p-5 shadow-[0_15px_40px_rgba(15,118,110,0.08)] backdrop-blur"
              >
                <item.icon className="h-8 w-8 text-emerald-500" />
                <p className="mt-3 text-lg font-semibold text-emerald-900">
                  {item.title}
                </p>
                <p className="text-sm text-emerald-900/80">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-8 text-sm text-emerald-900/70">
            {communityStats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-semibold text-emerald-600">
                  {stat.value}
                </p>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="relative z-10 w-full border-emerald-100 shadow-[0_20px_60px_rgba(15,118,110,0.18)]">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl text-emerald-950">
              Chào mừng quay lại
            </CardTitle>
            <CardDescription className="text-base text-emerald-900/80">
              Nhập email & mật khẩu hoặc dùng Google để tiếp tục
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-800"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 transition hover:text-emerald-800"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {loginMutation.isPending ? "Đang đăng nhập..." : "Login"}
              </Button>
            </form>

            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              Hoặc
              <span className="h-px flex-1 bg-border" />
            </div>

            <div
              className={`flex justify-center ${
                googleLoginMutation.isPending
                  ? "pointer-events-none opacity-70"
                  : ""
              }`}
            >
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                width="280"
                text="signin_with"
                shape="pill"
                locale="vi"
              />
            </div>

            <p className="text-center text-sm text-emerald-900/80">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-800"
              >
                Đăng ký ngay
                <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

