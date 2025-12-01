"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminOrders, useAdminProducts } from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Order, Product } from "@/lib/api/types";

interface ChartPoint {
  label: string;
  value: number;
}

export default function AdminReportsPage() {
  const { data: orders } = useAdminOrders();
  const { data: products } = useAdminProducts();

  const [startDate, setStartDate] = useState("2025-01-01");
  const [endDate, setEndDate] = useState("2025-01-12");

  const filteredOrders = useMemo(() => {
    const orderList: Order[] = Array.isArray(orders) ? orders : [];
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    return orderList.filter((order) => {
      const created = order.createdAt ? new Date(order.createdAt) : null;
      if (!created) return false;
      if (start && created < start) return false;
      if (end) {
        const endClone = new Date(end);
        endClone.setHours(23, 59, 59, 999);
        if (created > endClone) return false;
      }
      return true;
    });
  }, [orders, startDate, endDate]);

  const stats = useMemo(() => {
    const orderList = filteredOrders;
    const productList: Product[] = Array.isArray(products) ? products : [];

    const totalRevenue = orderList.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = orderList.length;
    const totalItemsSold = orderList.reduce((sum, order) => {
      const items = Array.isArray(order.items) ? order.items : [];
      return (
        sum +
        items.reduce((itemSum, item) => itemSum + (typeof item.quantity === "number" ? item.quantity : 0), 0)
      );
    }, 0);
    const averageOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    const productRevenueMap: Record<string, { name: string; revenue: number }> = {};
    orderList.forEach((order) => {
      order.items?.forEach((item) => {
        if (!item.productId) return;
        if (!productRevenueMap[item.productId]) {
          productRevenueMap[item.productId] = {
            name: item.productName || "Sản phẩm",
            revenue: 0,
          };
        }
        productRevenueMap[item.productId].revenue += item.lineTotal || item.unitPrice * item.quantity || 0;
      });
    });

    const topProductEntry = Object.values(productRevenueMap).sort((a, b) => b.revenue - a.revenue)[0];

    return [
      { title: "Tổng doanh thu", value: formatCurrency(totalRevenue) },
      { title: "Tổng đơn hàng", value: totalOrders.toString() },
      { title: "Giá trị đơn TB", value: formatCurrency(averageOrderValue) },
      {
        title: "Sản phẩm bán chạy",
        value: topProductEntry ? topProductEntry.name : `${productList.length} sản phẩm`,
      },
      { title: "Tổng sản phẩm đã bán", value: totalItemsSold.toString() },
    ];
  }, [filteredOrders, products]);

  const revenueByDay = useMemo<ChartPoint[]>(() => {
    const map = new Map<string, number>();
    filteredOrders.forEach((order) => {
      if (!order.createdAt) return;
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
        date.getDate()
      ).padStart(2, "0")}`;
      const current = map.get(key) || 0;
      map.set(key, current + (order.totalAmount || 0));
    });

    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => (a.label > b.label ? 1 : -1));
  }, [filteredOrders]);

  const revenueByProduct = useMemo<ChartPoint[]>(() => {
    const map: Record<string, ChartPoint> = {};
    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        if (!item.productId) return;
        if (!map[item.productId]) {
          map[item.productId] = {
            label: item.productName || "Sản phẩm",
            value: 0,
          };
        }
        map[item.productId].value += item.lineTotal || item.unitPrice * item.quantity || 0;
      });
    });

    return Object.values(map)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredOrders]);

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="container mx-auto px-6 py-10 space-y-8">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Dashboard / Admin</p>
          <h1 className="text-4xl font-bold text-slate-900 mt-2">Admin · Báo cáo & Thống kê</h1>
        </div>

        <Card className="border-emerald-100 shadow-sm">
          <CardContent className="grid gap-4 md:grid-cols-4 lg:grid-cols-5 py-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-emerald-800">Từ ngày</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border-emerald-100 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-emerald-800">Đến ngày</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border-emerald-100 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="flex items-end gap-3 md:col-span-2 lg:col-span-3">
              <Button className="flex-1 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400">
                Áp dụng
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  setStartDate("2025-01-01");
                  setEndDate("2025-01-12");
                }}
              >
                Đặt lại
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-full border border-emerald-500 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-600 shadow-sm"
          >
            Tổng hợp hệ thống
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat) => (
            <Card
              key={stat.title}
              className="border-emerald-100 shadow-[0_10px_30px_rgba(16,185,129,0.08)]"
            >
              <CardContent className="py-5">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-500">{stat.title}</p>
                <p className="mt-3 text-2xl font-semibold text-emerald-900">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle>Doanh thu theo ngày</CardTitle>
              <CardDescription>Biểu đồ thể hiện doanh thu theo thời gian.</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={revenueByDay} />
            </CardContent>
          </Card>

          <Card className="border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle>Doanh thu theo sản phẩm</CardTitle>
              <CardDescription>Top sản phẩm mang lại doanh thu cao nhất.</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={revenueByProduct} />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function SimpleLineChart({ data }: { data: ChartPoint[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const minValue = Math.min(...data.map((d) => d.value), 0);

  if (maxValue === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  }

  return (
    <svg viewBox="0 0 400 200" className="w-full rounded-xl border border-emerald-100 bg-white">
      <polyline
        fill="rgba(16,185,129,0.12)"
        stroke="#10b981"
        strokeWidth="3"
        points={data
          .map((point, index) => {
            const x = (index / (data.length - 1)) * 400;
            const normalized = (point.value - minValue) / (maxValue - minValue || 1);
            const y = 200 - normalized * 160 - 20;
            return `${x},${y}`;
          })
          .join(" ")}
      />
      {data.map((point, index) => {
        const x = (index / (data.length - 1)) * 400;
        const normalized = (point.value - minValue) / (maxValue - minValue || 1);
        const y = 200 - normalized * 160 - 20;
        return (
          <g key={point.label}>
            <circle cx={x} cy={y} r={4} fill="#059669" />
            <text x={x} y={190} textAnchor="middle" fontSize="10" fill="#0f172a">
              {point.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function SimpleBarChart({ data }: { data: ChartPoint[] }) {
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  if (maxValue === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  }

  return (
    <div className="flex items-end gap-4">
      {data.map((point) => {
        const heightPercent = Math.max((point.value / maxValue) * 100, 5);
        return (
          <div key={point.label} className="flex flex-col items-center">
            <div
              className="w-8 rounded-lg bg-emerald-200"
              style={{ height: `${heightPercent}%`, minHeight: 24 }}
            ></div>
            <span className="mt-2 text-xs font-semibold text-emerald-800 text-center">
              {point.label}
            </span>
            <span className="text-[10px] text-emerald-600">{formatCurrency(point.value)}</span>
          </div>
        );
      })}
    </div>
  );
}

