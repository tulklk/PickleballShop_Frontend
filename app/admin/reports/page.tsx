"use client";

import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminOrders, useAdminProducts } from "@/lib/api/hooks";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import type { Order, Product } from "@/lib/api/types";
import { Loader2 } from "lucide-react";

interface ChartPoint {
  label: string;
  value: number;
}

export default function AdminReportsPage() {
  const { data: orders, isLoading: ordersLoading, error: ordersError } = useAdminOrders();
  const { data: products, isLoading: productsLoading } = useAdminProducts();

  // Initialize dates from orders data or use defaults
  const getDefaultDates = (orderList: Order[]) => {
    if (!orderList || orderList.length === 0) {
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      return {
        start: oneYearAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    }

    const dates = orderList
      .map(order => order.createdAt ? new Date(order.createdAt) : null)
      .filter((date): date is Date => date !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      return {
        start: oneYearAgo.toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      };
    }

    return {
      start: dates[0].toISOString().split('T')[0],
      end: dates[dates.length - 1].toISOString().split('T')[0]
    };
  };

  const orderList: Order[] = Array.isArray(orders) ? orders : [];
  const defaultDates = useMemo(() => getDefaultDates(orderList), [orders]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [datesInitialized, setDatesInitialized] = useState(false);

  // Initialize dates when orders data is loaded
  useEffect(() => {
    if (!ordersLoading && orders && !datesInitialized) {
      const dates = getDefaultDates(orderList);
      setStartDate(dates.start);
      setEndDate(dates.end);
      setDatesInitialized(true);
    }
  }, [orders, ordersLoading, datesInitialized, orderList]);

  const filteredOrders = useMemo(() => {
    if (!orderList || orderList.length === 0) return [];
    
    // If no dates selected, show all orders
    if (!startDate && !endDate) return orderList;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    
    return orderList.filter((order) => {
      const created = order.createdAt ? new Date(order.createdAt) : null;
      if (!created) return false;
      
      // Set time to start of day for comparison
      if (start) {
        const startDay = new Date(start);
        startDay.setHours(0, 0, 0, 0);
        if (created < startDay) return false;
      }
      
      if (end) {
        const endDay = new Date(end);
        endDay.setHours(23, 59, 59, 999);
        if (created > endDay) return false;
      }
      
      return true;
    });
  }, [orderList, startDate, endDate]);

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

  if (ordersLoading || productsLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-emerald-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (ordersError) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="container mx-auto px-6 py-10">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">Không thể tải dữ liệu báo cáo. Vui lòng thử lại sau.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              <Button 
                className="flex-1 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400"
                onClick={() => {
                  // Apply filter - dates are already set, just refresh view
                }}
              >
                Áp dụng
              </Button>
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => {
                  const dates = defaultDates;
                  setStartDate(dates.start);
                  setEndDate(dates.end);
                }}
              >
                Đặt lại
              </Button>
            </div>
          </CardContent>
        </Card>


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
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  }

  const maxValue = Math.max(...data.map((d) => d.value), 0);
  const minValue = Math.min(...data.map((d) => d.value), 0);

  if (maxValue === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  }

  const dataLength = data.length > 1 ? data.length - 1 : 1;

  return (
    <svg viewBox="0 0 400 200" className="w-full rounded-xl border border-emerald-100 bg-white">
      <polyline
        fill="rgba(16,185,129,0.12)"
        stroke="#10b981"
        strokeWidth="3"
        points={data
          .map((point, index) => {
            const x = (index / dataLength) * 400;
            const normalized = (point.value - minValue) / (maxValue - minValue || 1);
            const y = 200 - normalized * 160 - 20;
            return `${x},${y}`;
          })
          .join(" ")}
      />
      {data.map((point, index) => {
        const x = (index / dataLength) * 400;
        const normalized = (point.value - minValue) / (maxValue - minValue || 1);
        const y = 200 - normalized * 160 - 20;
        return (
          <g key={`${point.label}-${index}`}>
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
  if (!data || data.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>;
  }

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

