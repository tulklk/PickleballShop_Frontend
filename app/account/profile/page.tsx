"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { useUserMe, useUpdateUser } from "@/lib/api/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Mail, User, Phone, Shield, UploadCloud, CalendarDays, Award, UserCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatDate } from "@/lib/utils/formatDate";
import { DEBUG_API } from "@/lib/utils/debugApi";
import { uploadImage } from "@/lib/api/uploadImage";
import { safeHttpUrl } from "@/lib/security/safeUrl";

const updateProfileSchema = z.object({
  fullName: z.string().min(1, "Họ tên không được để trống"),
  phoneNumber: z.string().optional().or(z.literal("")),
  avatarUrl: z
    .string()
    .max(2048, "URL tối đa 2048 ký tự")
    .refine((v) => v === "" || safeHttpUrl(v) !== null, "URL ảnh phải bắt đầu bằng http:// hoặc https://")
    .optional(),
});

type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

export default function ProfilePage() {
  return <ProfileContent />;
}

function ProfileContent() {
  const { data: user, isLoading, error } = useUserMe();
  const updateUser = useUpdateUser();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      phoneNumber: user?.phoneNumber || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  const avatarUrl = watch("avatarUrl");

  // Track the last uploaded avatar URL to prevent it from being overwritten
  const [lastUploadedAvatar, setLastUploadedAvatar] = useState<string | null>(null);

  // Update form when user data loads
  useEffect(() => {
    if (user) {
      const newAvatarUrl = user.avatarUrl || "";
      
      // If we just uploaded an avatar and it matches the user data, clear the tracking
      if (lastUploadedAvatar && newAvatarUrl === lastUploadedAvatar) {
        setLastUploadedAvatar(null);
      }
      
      // Only reset avatarUrl if we don't have a pending upload
      reset({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        avatarUrl: lastUploadedAvatar || newAvatarUrl,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: UpdateProfileFormData) => {
    if (!user) return;

    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          fullName: data.fullName || null,
          phoneNumber: data.phoneNumber || null,
          avatar: data.avatarUrl || null,
        },
      });
      toast.success("Cập nhật thông tin thành công");
    } catch (error: any) {
      if (DEBUG_API) {
        console.error("Update profile error:", error);
      }
      toast.error(error?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin");
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Vui lòng chọn ảnh nhỏ hơn 5MB");
      event.target.value = "";
      return;
    }

    try {
      setUploadingAvatar(true);
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes timeout

      try {
        const data = await uploadImage(file, "pickleball-shop/avatars", controller.signal);

        clearTimeout(timeoutId);

        const avatarUrl = data.url;
        
        if (DEBUG_API) {
          console.log("[Avatar Upload] Cloudinary upload successful:", avatarUrl);
        }

        // Store the uploaded avatar URL to prevent it from being overwritten
        setLastUploadedAvatar(avatarUrl);
        
        // Update form state immediately for instant UI feedback
        setValue("avatarUrl", avatarUrl, { shouldDirty: true });
        
        // Automatically save to backend
        if (user) {
          try {
            // Get current form values to preserve any unsaved changes
            const currentFormValues = watch();
            const updatePayload = {
              fullName: currentFormValues.fullName || null,
              phoneNumber: currentFormValues.phoneNumber || null,
              avatar: avatarUrl,
            };
            
            if (DEBUG_API) {
              console.log("[Avatar Upload] Updating user with payload:", {
                userId: user.id,
                payload: updatePayload,
              });
            }

            await updateUser.mutateAsync({
              id: user.id,
              data: updatePayload,
            });
            
            if (DEBUG_API) {
              console.log("[Avatar Upload] User update successful");
            }
            toast.success("Tải ảnh đại diện thành công");
          } catch (updateError: any) {
            if (DEBUG_API) {
              console.error("[Avatar Upload] Update error:", updateError);
              console.error("[Avatar Upload] Error details:", {
                message: updateError?.message,
                status: updateError?.status,
                data: updateError?.data,
              });
            }
            toast.error(updateError?.data?.message || updateError?.message || "Lưu ảnh đại diện thất bại");
            // Clear lastUploadedAvatar on error
            setLastUploadedAvatar(null);
          }
        } else {
          if (DEBUG_API) {
            console.warn("[Avatar Upload] User data not available");
          }
          toast.success("Tải ảnh đại diện thành công");
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("Upload timeout - ảnh quá lớn hoặc kết nối chậm");
        }
        throw error;
      }
    } catch (err: any) {
      toast.error(err?.message || "Không thể tải ảnh đại diện");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
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

  const loginName = user.email ? user.email.split("@")[0] : user.fullName || "Người dùng";
  const joinDate = user.createdAt ? formatDate(user.createdAt) : "—";
  const roleLabel =
    user.role === 2
      ? "Admin"
      : user.role === 1
        ? "Member"
        : "Member";
  // Priority: lastUploadedAvatar > user.avatarUrl from API > avatarUrl from form > fallback
  // Note: user.avatarUrl should be prioritized over form avatarUrl since it's the source of truth from backend
  const displayAvatar =
    lastUploadedAvatar ||
    user.avatarUrl ||
    avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      user.fullName || loginName
    )}&background=10b981&color=ffffff`;

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6">
      <div className="rounded-2xl md:rounded-3xl border border-emerald-100 bg-white shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
        <CardContent className="p-4 md:p-6 lg:p-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-emerald-500">
                Hồ sơ cá nhân
              </p>
              <h1 className="mt-2 text-2xl md:text-3xl font-bold text-emerald-950">
                {user.fullName || "Thành viên IKA"}
              </h1>
              <p className="text-xs md:text-sm text-emerald-800/70 mt-1">
                Quản lý thông tin tài khoản và cập nhật ảnh đại diện của bạn.
              </p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-emerald-50">
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={triggerAvatarUpload}
                disabled={uploadingAvatar}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs md:text-sm"
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 md:h-4 md:w-4 animate-spin" />
                    <span className="hidden sm:inline">Đang tải...</span>
                    <span className="sm:hidden">Tải...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                    Sửa ảnh đại diện
                  </>
                )}
              </Button>
              <p className="text-xs text-slate-500 text-center">Vui lòng chọn ảnh nhỏ hơn 5MB</p>
            </div>
          </div>

          <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <OverviewItem label="Tên đăng nhập" icon={UserCheck} value={loginName} />
            <OverviewItem label="Email" icon={Mail} value={user.email || "—"} />
            <OverviewItem label="Nhóm khách hàng" icon={Shield} value={roleLabel} />
            <OverviewItem label="Ngày tham gia" icon={CalendarDays} value={joinDate} />
          </div>
        </CardContent>
      </div>

      <Card className="border-emerald-100 bg-white/90 shadow-lg">
        <CardContent className="p-4 md:p-6 lg:p-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email-display" className="flex items-center gap-2 text-emerald-700 text-sm md:text-base">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <Input
                id="email-display"
                type="email"
                value={user.email || ""}
                disabled
                className="bg-emerald-50 cursor-not-allowed h-10 md:h-11 text-sm md:text-base"
              />
              <p className="text-xs text-slate-500">Email dùng để đăng nhập và không thể thay đổi.</p>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-emerald-700 text-sm md:text-base">
                  <User className="h-4 w-4" />
                  Họ và tên *
                </Label>
                <Input
                  id="fullName"
                  {...register("fullName")}
                  placeholder="Nhập họ và tên"
                  className="h-10 md:h-11 text-sm md:text-base"
                />
                {errors.fullName && (
                  <p className="text-xs md:text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-emerald-700 text-sm md:text-base">
                  <Phone className="h-4 w-4" />
                  Số điện thoại
                </Label>
                <Input
                  id="phoneNumber"
                  {...register("phoneNumber")}
                  placeholder="Nhập số điện thoại"
                  className="h-10 md:h-11 text-sm md:text-base"
                />
                {errors.phoneNumber && (
                  <p className="text-xs md:text-sm text-red-600">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            <input type="hidden" {...register("avatarUrl")} />

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={updateUser.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 px-6 md:px-8 text-sm md:text-base w-full md:w-auto"
              >
                {updateUser.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function OverviewItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl md:rounded-2xl border border-emerald-50 bg-emerald-50/50 p-3 md:p-4 flex items-center gap-2 md:gap-3">
      <div className="rounded-lg md:rounded-xl bg-white p-1.5 md:p-2 text-emerald-600 shadow-inner shrink-0">
        <Icon className="h-4 w-4 md:h-5 md:w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] md:text-xs uppercase tracking-widest text-emerald-500 truncate">{label}</p>
        <p className="text-sm md:text-lg font-semibold text-emerald-900 truncate">{value || "—"}</p>
      </div>
    </div>
  );
}

