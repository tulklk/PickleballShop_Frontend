"use client";

import { useState, useEffect } from "react";
import { useUserMe, useUpdateUser } from "@/lib/api/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Save, Mail, User, Phone, Edit2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Họ tên không được để trống"),
  phoneNumber: z.string().optional().or(z.literal("")),
});

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export default function ProfilePage() {
  return <ProfileContent />;
}

function ProfileContent() {
  const { data: user, isLoading, error } = useUserMe();
  const updateUser = useUpdateUser();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
    },
  });

  // Update form when user data loads
  useEffect(() => {
    if (user && !isEditing) {
      reset({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [user, isEditing, reset]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    if (!user) return;

    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          fullName: data.fullName || null,
          phoneNumber: data.phoneNumber || null,
        },
      });
      toast.success("Cập nhật thông tin thành công");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Update profile error:", error);
      toast.error(error?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Không thể tải thông tin người dùng</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card>
          <CardContent className="pt-6">
            <p>Không tìm thấy thông tin người dùng</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500 mb-2">
            Hồ sơ cá nhân
          </p>
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-emerald-950">
              {user.fullName || "Thành viên IKA"}
            </h1>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all"
                size="lg"
              >
                <Edit2 className="mr-2 h-4 w-4" />
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>

        {isEditing ? (
          /* Edit Mode */
          <Card className="border-emerald-100 bg-white shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-emerald-950">
                  Chỉnh sửa thông tin
                </h2>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    reset({
                      fullName: user.fullName || "",
                      phoneNumber: user.phoneNumber || "",
                    });
                  }}
                  disabled={updateUser.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email - Read Only */}
                <div className="space-y-2">
                  <Label htmlFor="email-display" className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="email-display"
                    type="email"
                    value={user.email || ""}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email không thể thay đổi
                  </p>
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Họ và tên *
                  </Label>
                  <Input
                    id="fullName"
                    {...register("fullName")}
                    placeholder="Nhập họ và tên"
                    className="h-11"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Số điện thoại
                  </Label>
                  <Input
                    id="phoneNumber"
                    {...register("phoneNumber")}
                    placeholder="Nhập số điện thoại"
                    className="h-11"
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={updateUser.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                    size="lg"
                  >
                    {updateUser.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false);
                      reset({
                        fullName: user.fullName || "",
                        phoneNumber: user.phoneNumber || "",
                      });
                    }}
                    disabled={updateUser.isPending}
                    size="lg"
                  >
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          /* View Mode */
          <div className="space-y-6">
            {/* Email Card */}
            <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 shadow-sm">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-widest text-emerald-500 mb-1">
                      Email
                    </p>
                    <p className="text-xl font-semibold text-emerald-950">
                      {user.email || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Full Name Card */}
            <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 shadow-sm">
                    <User className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-widest text-emerald-500 mb-1">
                      Họ và tên
                    </p>
                    <p className="text-xl font-semibold text-emerald-950">
                      {user.fullName || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phone Number Card */}
            <Card className="border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 shadow-sm">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs uppercase tracking-widest text-emerald-500 mb-1">
                      Số điện thoại
                    </p>
                    <p className="text-xl font-semibold text-emerald-950">
                      {user.phoneNumber || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

