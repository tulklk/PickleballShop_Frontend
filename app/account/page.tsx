"use client";

import { useAuth } from "@/lib/auth/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Phone, ShieldCheck } from "lucide-react";

export default function AccountPage() {
  return <AccountContent />;
}

function AccountContent() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-6 md:py-10 space-y-6">
        <div className="rounded-2xl md:rounded-3xl border border-emerald-100 bg-white/80 p-4 md:p-8 shadow-[0_25px_80px_rgba(15,118,110,0.12)]">
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-emerald-500">
            Hồ sơ cá nhân
          </p>
          <h1 className="mt-2 text-2xl md:text-4xl font-bold text-emerald-950">
            {user?.fullName || "Thành viên IKA"}
          </h1>
          <p className="mt-3 text-sm md:text-base text-emerald-900/80">
            Quản lý thông tin tài khoản, theo dõi đơn hàng và tiếp tục hành trình
            Pickleball của bạn.
          </p>
          <div className="mt-4 md:mt-6 grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-3">
            <ProfileItem
              label="Email"
              value={user?.email || "Chưa cập nhật"}
              icon={Mail}
            />
            <ProfileItem
              label="Số điện thoại"
              value={user?.phoneNumber || "Chưa cập nhật"}
              icon={Phone}
            />
            <ProfileItem
              label="Quyền truy cập"
              value={user?.role || "Customer"}
              icon={ShieldCheck}
            />
          </div>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-[2fr_1fr]">
          <Card className="border-emerald-100 bg-white/90 shadow-[0_20px_60px_rgba(15,118,110,0.1)]">
            <CardHeader>
              <CardTitle>Hoạt động gần đây</CardTitle>
              <CardDescription>
                Kiểm tra các đơn hàng đã tạo và trạng thái mới nhất.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link href="/account/orders">
                <Button className="bg-emerald-500 text-white hover:bg-emerald-400">
                  Xem lịch sử đơn hàng
                </Button>
              </Link>
              <Link href="/cart">
                <Button variant="outline" className="border-emerald-200">
                  Quay lại giỏ hàng
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-white/90 shadow-[0_20px_60px_rgba(15,118,110,0.1)]">
            <CardHeader>
              <CardTitle>Tác vụ nhanh</CardTitle>
              <CardDescription>
                Rút gọn hành động thường dùng cho tài khoản của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickAction
                href="/products"
                title="Tiếp tục mua sắm"
                description="Khám phá paddle, bóng, phụ kiện mới"
              />
              <QuickAction
                href="/account/orders"
                title="Theo dõi tình trạng đơn"
                description="Nhận cập nhật mới nhất của mỗi đơn hàng"
              />
              <QuickAction
                href="/cart"
                title="Giỏ hàng của tôi"
                description="Kiểm tra các sản phẩm đã thêm gần đây"
              />
            </CardContent>
          </Card>
        </div>
    </div>
  );
}

function ProfileItem({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl md:rounded-2xl border border-emerald-50 bg-white/60 p-3 md:p-4">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="rounded-lg md:rounded-xl bg-emerald-100/80 p-1.5 md:p-2 text-emerald-700 shrink-0">
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] md:text-xs uppercase tracking-widest text-emerald-500 truncate">
            {label}
          </p>
          <p className="text-sm md:text-lg font-semibold text-emerald-950 truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-emerald-50 bg-emerald-50/60 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white"
    >
      <div>
        <p className="font-semibold text-emerald-950">{title}</p>
        <p className="text-sm text-emerald-900/70">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-emerald-600" />
    </Link>
  );
}

