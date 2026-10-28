"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Shield, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useChangePassword } from "@/lib/api/hooks";
import { apiClient } from "@/lib/api/client";
import { passwordSchema } from "@/lib/validation/password";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Mật khẩu hiện tại tối thiểu 6 ký tự"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu nhập lại không khớp",
    path: ["confirmNewPassword"],
  });

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export default function SecurityPage() {
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (values: ChangePasswordForm) => {
    try {
      await changePassword.mutateAsync(values);
      reset();
      // Backend thu hồi mọi refresh token sau khi đổi mật khẩu => đăng xuất phía client và yêu cầu đăng nhập lại.
      toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      apiClient.clearSession();
    } catch (error: any) {
      const message =
        error?.data?.message ||
        error?.message ||
        "Không thể đổi mật khẩu. Vui lòng kiểm tra lại thông tin.";
      toast.error(message);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="rounded-3xl border border-emerald-100 bg-white p-6 lg:p-8 shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center">
            <Shield className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
              Mật khẩu & Bảo mật
            </h1>
            <p className="text-sm text-emerald-900/80 mt-1">
              Vì sự an toàn, hãy sử dụng mật khẩu mạnh và không chia sẻ cho bất kỳ ai.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-1">
          {/* Change password */}
          <Card className="border-emerald-100 bg-white/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Lock className="h-5 w-5 text-emerald-600" />
                Đổi mật khẩu
              </CardTitle>
              <CardDescription>
                Thay đổi mật khẩu đăng nhập tài khoản của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    autoComplete="current-password"
                    {...register("currentPassword")}
                  />
                  {errors.currentPassword && (
                    <p className="text-sm text-red-600">
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Mật khẩu mới</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      autoComplete="new-password"
                      {...register("newPassword")}
                    />
                    {errors.newPassword && (
                      <p className="text-sm text-red-600">
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Nhập lại mật khẩu mới</Label>
                    <Input
                      id="confirmNewPassword"
                      type="password"
                      autoComplete="new-password"
                      {...register("confirmNewPassword")}
                    />
                    {errors.confirmNewPassword && (
                      <p className="text-sm text-red-600">
                        {errors.confirmNewPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-xs text-emerald-800/70 space-y-1 bg-emerald-50/60 border border-emerald-100 rounded-lg p-3">
                  <p>Mật khẩu của bạn:</p>
                  <p>- Phải từ 8 ký tự trở lên</p>
                  <p>- Nên có ít nhất 1 số và 1 ký tự đặc biệt</p>
                </div>

                <Button
                  type="submit"
                  className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={changePassword.isPending}
                >
                  {changePassword.isPending ? (
                    <>
                      <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


