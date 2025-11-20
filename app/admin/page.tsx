"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  ShoppingBag,
  ShoppingCart,
  Tag,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import {
  useAdminOrders,
  useAdminProducts,
  useAdminCategories,
} from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import type { Product, OrderDto, ProductCategory } from "@/lib/api/types";

export default function AdminDashboard() {
  const { data: orders } = useAdminOrders();
  const { data: products } = useAdminProducts();
  const { data: categories } = useAdminCategories();

  const stats = useMemo(() => {
    const orderList: OrderDto[] = Array.isArray(orders) ? orders : [];
    const productList: Product[] = Array.isArray(products) ? products : [];
    const categoryList: ProductCategory[] = Array.isArray(categories) ? categories : [];

    const totalRevenue = orderList.reduce(
      (sum, order) => sum + (order.totalAmount || 0),
      0
    );

    const pendingOrders = orderList.filter(
      (order) => order.orderStatus === "Pending"
    ).length;

    const lowStock = productList.filter(
      (product) => product.stockQuantity !== undefined && product.stockQuantity < 10
    ).length;

    return [
      {
        title: "Doanh thu toàn thời gian",
        value: formatCurrency(totalRevenue),
        change: "+18% MoM",
        icon: TrendingUp,
      },
      {
        title: "Đơn hàng đang xử lý",
        value: pendingOrders,
        change: `${orderList.length} đơn trong hệ thống`,
        icon: ShoppingCart,
      },
      {
        title: "Sản phẩm đang kinh doanh",
        value: productList.length,
        change: `${lowStock} sản phẩm dưới 10 tồn`,
        icon: Package,
      },
      {
        title: "Danh mục",
        value: categoryList.length,
        change: "Tạo thêm danh mục để tổ chức sản phẩm",
        icon: Tag,
      },
    ];
  }, [orders, products, categories]);

  const recentOrders = Array.isArray(orders) ? orders.slice(0, 5) : [];
  const lowStockProducts = Array.isArray(products)
    ? products
        .filter(
          (product) =>
            typeof product.stockQuantity === "number" && product.stockQuantity < 15
        )
        .sort((a, b) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0))
        .slice(0, 5)
    : [];

  return (
    <div className="bg-linear-to-b from-[#f0fff5] via-white to-[#f7fffa]">
      <div className="container mx-auto px-4 py-10 space-y-10">
        <section className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-[0_25px_70px_rgba(15,118,110,0.12)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">
                Bảng điều khiển
              </p>
              <h1 className="text-4xl font-bold text-emerald-950 mt-2">
                Xin chào, Admin IKA
              </h1>
              <p className="mt-3 text-emerald-900/80 max-w-2xl">
                Theo dõi nhanh doanh thu, đơn hàng và trạng thái tồn kho để đảm
                bảo mọi thứ vận hành mượt mà trước mùa giải Pickleball.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/orders">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-white">
                  Quản lý đơn hàng
                </Button>
              </Link>
              <Link href="/admin/products">
                <Button variant="outline" className="border-emerald-200">
                  Thêm sản phẩm mới
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="border-emerald-100 bg-white/90 shadow-[0_15px_45px_rgba(15,118,110,0.1)]"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-900/80">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-5 w-5 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-950">
                  {stat.value}
                </div>
                <p className="text-sm text-emerald-900/70">{stat.change}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-emerald-100 bg-white/90 shadow-[0_20px_60px_rgba(15,118,110,0.12)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Đơn hàng gần nhất</CardTitle>
                <CardDescription>
                  Theo dõi trạng thái xử lý và thanh toán
                </CardDescription>
              </div>
              <Link href="/admin/orders">
                <Button variant="outline" size="sm">
                  Xem tất cả
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Chưa có đơn hàng nào.
                </p>
              ) : (
                <div className="rounded-2xl border border-emerald-50">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã đơn</TableHead>
                        <TableHead>Ngày tạo</TableHead>
                        <TableHead>Thanh toán</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Tổng tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">
                            #{order.orderNumber ?? order.id.slice(0, 8)}
                          </TableCell>
                          <TableCell>
                            {formatDate(order.createdAt ?? "")}
                          </TableCell>
                          <TableCell>{order.paymentStatus ?? "-"}</TableCell>
                          <TableCell>
                            <StatusBadge status={order.orderStatus ?? "N/A"} />
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(order.totalAmount ?? 0)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-white/90 shadow-[0_20px_60px_rgba(15,118,110,0.12)]">
            <CardHeader>
              <CardTitle>Tác vụ nhanh</CardTitle>
              <CardDescription>
                Rút ngắn thời gian xử lý các công việc thường gặp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuickAction
                title="Tạo sản phẩm mới"
                description="Đăng paddle, bóng, phụ kiện mới với vài bước."
                icon={ShoppingBag}
                href="/admin/products"
                cta="Đi đến sản phẩm"
              />
              <QuickAction
                title="Quản lý tồn kho"
                description="Kiểm tra sản phẩm sắp hết để nhập thêm kịp thời."
                icon={Warehouse}
                href="/admin/products"
                cta="Kiểm tra tồn"
              />
              <QuickAction
                title="Cấu trúc danh mục"
                description="Tối ưu danh mục để khách tìm kiếm dễ dàng."
                icon={Tag}
                href="/admin/categories"
                cta="Quản lý danh mục"
              />
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-emerald-100 bg-white/90 shadow-[0_15px_45px_rgba(15,118,110,0.12)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sản phẩm sắp hết hàng</CardTitle>
                <CardDescription>
                  Ưu tiên nhập thêm để tránh gián đoạn bán hàng.
                </CardDescription>
              </div>
              <Link href="/admin/products">
                <Button variant="outline" size="sm">
                  Xem kho
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tất cả sản phẩm đang có tồn kho an toàn.
                </p>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-emerald-50 bg-emerald-50/50 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-emerald-950">
                            {product.name}
                          </p>
                          <p className="text-sm text-emerald-900/70">
                            SKU: {product.sku ?? "N/A"}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-emerald-700">
                          {product.stockQuantity ?? 0} chiếc
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-emerald-100 bg-white/90 shadow-[0_15px_45px_rgba(15,118,110,0.12)]">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Nhắc việc hôm nay</CardTitle>
                <CardDescription>
                  Checklist nhanh để đội vận hành theo kịp tiến độ.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <TaskBullet label="Xác nhận các đơn pending để chuẩn bị giao." />
              <TaskBullet label="Đăng lên combo paddle + giày trong tuần lễ khuyến mãi." />
              <TaskBullet label="Kiểm tra lịch workshop và cập nhật banner trang chủ." />
              <TaskBullet label="Liên hệ đối tác nhập bóng thi đấu (còn 25% tồn)." />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase();
  let color = "bg-emerald-100 text-emerald-700";
  if (normalized?.includes("cancel")) color = "bg-red-100 text-red-700";
  if (normalized?.includes("process")) color = "bg-amber-100 text-amber-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${color}`}
    >
      {status || "N/A"}
    </span>
  );
}

function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  cta,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-emerald-50 bg-emerald-50/40 p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-emerald-100/80 p-2 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-emerald-950">{title}</p>
          <p className="text-sm text-emerald-900/70">{description}</p>
          <span className="text-sm font-semibold text-emerald-600">{cta}</span>
        </div>
      </div>
    </Link>
  );
}

function TaskBullet({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-50 bg-emerald-50/60 p-4">
      <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
      <p className="text-sm text-emerald-900">{label}</p>
    </div>
  );
}

