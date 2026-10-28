"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, XCircle } from "lucide-react";
import { useResetPassword } from "@/lib/api/hooks";
import { passwordSchema } from "@/lib/validation/password";
import { useCooldown } from "@/lib/hooks/useCooldown";
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

const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmNewPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetMutation = useResetPassword();
  const cooldown = useCooldown();

  // token/email lấy từ link trong email; chỉ chấp nhận định dạng hợp lệ và độ dài hợp lý.
  const token = (searchParams.get("token") || "").trim();
  const email = (searchParams.get("email") || "").trim();
  const linkValid = token.length > 0 && token.length <= 2048 && EMAIL_RE.test(email) && email.length <= 254;

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Sau khi đặt lại thành công: mọi phiên cũ đã bị thu hồi => chuyển sang đăng nhập.
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push("/login"), 3000);
    return () => clearTimeout(t);
  }, [done, router]);

  const onSubmit = async (values: ResetPasswordFormData) => {
    setServerError(null);
    try {
      await resetMutation.mutateAsync({
        email,
        token,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });
      setDone(true);
    } catch (error: any) {
      if (cooldown.start(error)) {
        toast.error(error?.data?.message || "Bạn thao tác quá nhanh, vui lòng thử lại sau.");
        return;
      }
      // 400: link hết hạn/đã dùng hoặc mật khẩu yếu — hiển thị message từ server nếu có.
      setServerError(
        error?.data?.message ||
          "Không thể đặt lại mật khẩu. Link có thể đã hết hạn hoặc đã được sử dụng."
      );
    }
  };

  const renderBody = () => {
    if (!linkValid) {
      return (
        <div className="space-y-4 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <p className="text-sm text-red-700">
            Link đặt lại mật khẩu không hợp lệ hoặc bị thiếu thông tin.
          </p>
          <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
            <Link href="/forgot-password">Gửi lại link</Link>
          </Button>
        </div>
      );
    }

    if (done) {
      return (
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-900">Đặt lại mật khẩu thành công!</p>
          <p className="text-sm text-emerald-800">
            Mọi phiên đăng nhập cũ đã bị đăng xuất. Đang chuyển đến trang đăng nhập...
          </p>
          <Button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            Đăng nhập ngay
          </Button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p>{serverError}</p>
            <Link
              href="/forgot-password"
              className="mt-2 inline-block font-semibold text-red-700 underline"
            >
              Gửi lại link đặt lại mật khẩu
            </Link>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="newPassword">Mật khẩu mới</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            maxLength={128}
            {...register("newPassword")}
            className="border-emerald-200 focus:border-emerald-400"
          />
          {errors.newPassword && (
            <p className="text-sm text-destructive">{errors.newPassword.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            8–128 ký tự, có ít nhất 1 chữ cái và 1 chữ số, không dùng mật khẩu quá phổ biến.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmNewPassword">Nhập lại mật khẩu mới</Label>
          <Input
            id="confirmNewPassword"
            type="password"
            autoComplete="new-password"
            maxLength={128}
            {...register("confirmNewPassword")}
            className="border-emerald-200 focus:border-emerald-400"
          />
          {errors.confirmNewPassword && (
            <p className="text-sm text-destructive">{errors.confirmNewPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-700"
          disabled={resetMutation.isPending || cooldown.isCoolingDown}
        >
          {resetMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : cooldown.isCoolingDown ? (
            `Thử lại sau ${cooldown.secondsLeft}s`
          ) : (
            "Đặt lại mật khẩu"
          )}
        </Button>
      </form>
    );
  };

  return (
    <section className="relative overflow-hidden bg-linear-to-b from-[#f0fff5] via-white to-[#eefbf1]">
      <div className="container relative mx-auto min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-16">
        <Card className="relative z-10 w-full max-w-md border-emerald-100 shadow-[0_20px_60px_rgba(15,118,110,0.18)]">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <KeyRound className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-3xl text-emerald-950">Đặt lại mật khẩu</CardTitle>
            <CardDescription className="text-base text-emerald-900/80">
              {linkValid && !done ? `Tài khoản: ${email}` : "Tạo mật khẩu mới cho tài khoản của bạn"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderBody()}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
