"use client";

import { useMemo, useState } from "react";
import { useMyOrders, useProduct } from "@/lib/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Package,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ShoppingBag,
  ArrowRight,
  Loader2,
  Receipt,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectItem } from "@/components/ui/select";
import Image from "next/image";
import type { OrderItemDto } from "@/lib/api/types";

export default function OrdersPage() {
  return <OrdersContent />;
}

function getStatusBadge(orderStatus: string | null) {
  if (!orderStatus) return null;
  
  const status = orderStatus.toLowerCase();
  if (status.includes("completed") || status.includes("hoàn thành")) {
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Hoàn thành
      </Badge>
    );
  }
  if (status.includes("pending") || status.includes("chờ")) {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
        <Clock className="h-3 w-3 mr-1" />
        Đang chờ
      </Badge>
    );
  }
  if (status.includes("processing") || status.includes("xử lý")) {
    return (
      <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
        <Truck className="h-3 w-3 mr-1" />
        Đang xử lý
      </Badge>
    );
  }
  if (status.includes("cancelled") || status.includes("hủy")) {
    return (
      <Badge className="bg-red-500 hover:bg-red-600 text-white">
        <XCircle className="h-3 w-3 mr-1" />
        Đã hủy
      </Badge>
    );
  }
  if (status.includes("shipped") || status.includes("giao")) {
    return (
      <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
        <Truck className="h-3 w-3 mr-1" />
        Đang giao
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      {orderStatus}
    </Badge>
  );
}

function getPaymentStatusBadge(paymentStatus: string | null) {
  if (!paymentStatus) return null;
  
  const status = paymentStatus.toLowerCase();
  if (status.includes("completed") || status.includes("paid") || status.includes("hoàn thành")) {
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        Đã thanh toán
      </Badge>
    );
  }
  if (status.includes("pending") || status.includes("chờ")) {
    return (
      <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
        <Clock className="h-3 w-3 mr-1" />
        Chờ thanh toán
      </Badge>
    );
  }
  if (status.includes("failed") || status.includes("thất bại")) {
    return (
      <Badge className="bg-red-500 hover:bg-red-600 text-white">
        <XCircle className="h-3 w-3 mr-1" />
        Thất bại
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      {paymentStatus}
    </Badge>
  );
}

function getPaymentMethodLabel(method: string | null) {
  if (!method) return "Chưa xác định";
  const m = method.toLowerCase();
  if (m.includes("cod")) return "Thanh toán khi nhận hàng";
  if (m.includes("momo")) return "Ví MoMo";
  if (m.includes("vnpay")) return "VNPay";
  if (m.includes("bank") || m.includes("payos")) return "Chuyển khoản";
  return method;
}

function OrdersContent() {
  const { data: orders = [], isLoading } = useMyOrders();
  const [orderCode, setOrderCode] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "completed" | "pending" | "processing" | "cancelled">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesCode =
        !orderCode ||
        order.orderNumber?.toLowerCase().includes(orderCode.toLowerCase()) ||
        order.id.toLowerCase().includes(orderCode.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (order.orderStatus || "").toLowerCase().includes(statusFilter === "completed" ? "completed" : statusFilter === "pending" ? "pending" : statusFilter === "processing" ? "processing" : "cancelled");

      const orderDate = new Date(order.createdAt).getTime();
      const matchesFrom = !fromDate || orderDate >= new Date(fromDate).getTime();
      const matchesTo = !toDate || orderDate <= new Date(toDate).getTime();

      return matchesCode && matchesStatus && matchesFrom && matchesTo;
    });
  }, [orders, orderCode, statusFilter, fromDate, toDate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mb-4" />
        <p className="text-emerald-900/70 text-lg">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="h-20 w-20 mx-auto mb-6 text-emerald-500/50" />
        <h2 className="text-2xl font-bold mb-2 text-emerald-900">
          Chưa có đơn hàng nào
        </h2>
        <p className="text-muted-foreground mb-8">
          Bạn chưa có đơn hàng nào. Hãy bắt đầu mua sắm ngay!
        </p>
        <Link href="/products">
          <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <ShoppingBag className="mr-2 h-5 w-5" />
            Bắt đầu mua sắm
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="mb-2 mt-4 md:mt-6 ml-4 md:ml-6">
        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
          Lịch sử đơn hàng
        </h1>
        <p className="text-xs md:text-sm text-slate-600 mt-1">
          Hiển thị thông tin các sản phẩm bạn đã mua tại PickleBall Shop.
        </p>
      </div>

      <Card className="border-slate-200 mx-4 md:mx-0">
        <CardHeader className="pb-3 md:pb-4 p-4 md:p-6">
          <CardTitle className="text-base md:text-lg text-slate-900 flex items-center gap-2">
            <Filter className="h-4 w-4 text-emerald-600" />
            Bộ lọc đơn hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4 md:p-6">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label className="text-sm md:text-base">Mã đơn hàng</Label>
              <Input
                placeholder="Nhập mã đơn hàng"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                className="h-10 md:h-11 text-sm md:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm md:text-base">Trạng thái</Label>
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as "all" | "completed" | "pending" | "processing" | "cancelled")
                }
                className="h-10 md:h-11"
              >
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
                <SelectItem value="processing">Đang xử lý</SelectItem>
                <SelectItem value="completed">Hoàn thành</SelectItem>
                <SelectItem value="cancelled">Đã hủy</SelectItem>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm md:text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Từ ngày
              </Label>
              <Input 
                type="date" 
                value={fromDate} 
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 md:h-11 text-sm md:text-base"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm md:text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Đến ngày
              </Label>
              <Input 
                type="date" 
                value={toDate} 
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 md:h-11 text-sm md:text-base"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOrderCode("");
                setStatusFilter("all");
                setFromDate("");
                setToDate("");
              }}
              className="text-sm md:text-base w-full md:w-auto"
            >
              Xóa bộ lọc
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm mx-4 md:mx-0">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Thời gian</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Mã đơn hàng</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Sản phẩm</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Tổng tiền</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {filteredOrders.map((order) => {
              const firstItem = order.items?.[0];
              const remaining = (order.items?.length || 0) - 1;
              return (
                <tr key={order.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">{order.orderNumber || order.id}</td>
                  <td className="px-4 py-3">
                    <OrderProductPreview item={firstItem} remaining={remaining} />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(order.orderStatus)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/account/orders/${order.id}`}>
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-xs font-medium border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                    >
                        Chi tiết
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-500">
            Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 mx-4">
        {filteredOrders.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-500 bg-white rounded-xl border border-slate-200 p-4">
            Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const firstItem = order.items?.[0];
            const remaining = (order.items?.length || 0) - 1;
            return (
              <Card key={order.id} className="border-slate-200 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-600">{formatDate(order.createdAt)}</span>
                      </div>
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {order.orderNumber || order.id}
                      </p>
                    </div>
                    <div className="shrink-0">
                      {getStatusBadge(order.orderStatus)}
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-100 pt-3">
                    <OrderProductPreview item={firstItem} remaining={remaining} />
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Tổng tiền</p>
                      <p className="font-semibold text-base text-slate-900">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    <Link href={`/account/orders/${order.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 text-xs font-medium border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                      >
                        Chi tiết
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

function OrderProductPreview({ item, remaining }: { item?: OrderItemDto; remaining: number }) {
  const shouldFetchProduct = !!item && !item.productImageUrl && !!item.productId;
  const { data: product } = useProduct(shouldFetchProduct ? item.productId : "");

  if (!item) {
    return <span>-</span>;
  }

  const imageUrl =
    item.productImageUrl ||
    product?.primaryImageUrl ||
    (product?.imageUrls && product.imageUrls[0]) ||
    null;

  const isValidUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return url.startsWith("/") || url.startsWith("./");
    }
  };

  return (
    <div className="flex items-center gap-2 md:gap-3">
      <div className="relative h-10 w-10 md:h-12 md:w-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
        {imageUrl && isValidUrl(imageUrl) ? (
          <Image
            src={imageUrl}
            alt={item.productName || "Sản phẩm"}
            fill
            className="object-cover"
            sizes="48px"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Package className="h-4 w-4 md:h-5 md:w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-sm md:text-base text-slate-900 truncate">{item.productName || "Sản phẩm"}</p>
        {/* Variant Info */}
        {item.variantInfo && (
          <p className="text-xs text-slate-500 truncate">
            {item.variantInfo}
          </p>
        )}
        <p className="text-xs text-slate-500">
          Số lượng : {item.quantity}
          {remaining > 0 && <span className="ml-2 text-blue-600">+{remaining} sản phẩm</span>}
        </p>
      </div>
    </div>
  );
}
