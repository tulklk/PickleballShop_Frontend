"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAdminOrders } from "@/lib/api/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderStatus, PaymentStatus, OrderStatusLabels, normalizeOrderStatus } from "@/lib/api/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminPagination } from "@/components/admin/AdminPagination";

function getOrderStatusText(status: OrderStatus | string): string {
  const normalizedStatus = normalizeOrderStatus(status);
  return OrderStatusLabels[normalizedStatus] || "Không xác định";
}

function getPaymentStatusText(status: PaymentStatus | string): string {
  // Handle string values from backend
  if (typeof status === "string") {
    const statusLower = status.toLowerCase();
    if (statusLower.includes("pending") || statusLower.includes("chờ")) {
      return "Chờ thanh toán";
    }
    if (statusLower.includes("processing") || statusLower.includes("xử lý")) {
      return "Đang xử lý";
    }
    if (statusLower.includes("completed") || statusLower.includes("hoàn thành") || statusLower.includes("paid")) {
      return "Đã thanh toán";
    }
    if (statusLower.includes("failed") || statusLower.includes("thất bại")) {
      return "Thanh toán thất bại";
    }
    return status; // Return original string if no match
  }
  
  // Handle enum values
  switch (status) {
    case PaymentStatus.Pending:
      return "Chờ thanh toán";
    case PaymentStatus.Processing:
      return "Đang xử lý";
    case PaymentStatus.Completed:
      return "Đã thanh toán";
    case PaymentStatus.Failed:
      return "Thanh toán thất bại";
    default:
      return "Không xác định";
  }
}

export default function AdminOrdersPage() {
  const { data: orders, isLoading, error } = useAdminOrders();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredOrders = useMemo(() => {
    const rawList = Array.isArray(orders) ? orders : [];
    if (!searchTerm.trim()) return rawList;

    const term = searchTerm.trim().toLowerCase();
    return rawList.filter((order: any) => {
      const orderNumber = (order.orderNumber || "").toLowerCase();
      const customerName = (
        order.user?.fullName ||
        order.shippingAddress?.fullName ||
        order.shippingFullName ||
        ""
      ).toLowerCase();
      const total = String(order.totalAmount ?? "").toLowerCase();

      return (
        orderNumber.includes(term) ||
        customerName.includes(term) ||
        total.includes(term)
      );
    });
  }, [orders, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Ensure currentPage doesn't exceed totalPages when filtered results change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // Debug logging
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("[AdminOrdersPage] orders:", orders);
      console.log("[AdminOrdersPage] orders length:", orders?.length);
      console.log("[AdminOrdersPage] isLoading:", isLoading);
      console.log("[AdminOrdersPage] error:", error);
    }
  }, [orders, isLoading, error]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Đang tải đơn hàng...</div>
      </div>
    );
  }

  if (error) {
    console.error("[AdminOrdersPage] Error details:", error);
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 font-semibold mb-2">Không thể tải danh sách đơn hàng</p>
            <p className="text-sm text-red-500">
              {error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Quản lý đơn hàng</h1>

      <Card>
        <CardHeader>
          <div className="mt-4 w-full md:w-80">
            <Label
              htmlFor="order-search"
              className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500"
            >
              Tìm kiếm đơn hàng
            </Label>
            <Input
              id="order-search"
              placeholder="Tìm theo mã đơn, khách hàng hoặc tổng tiền..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to page 1 when searching
              }}
              className="mt-1"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders && Array.isArray(filteredOrders) && filteredOrders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đơn hàng</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Thanh toán</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.orderNumber || "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.user?.fullName || 
                         order.shippingAddress?.fullName || 
                         order.shippingFullName || 
                         "N/A"}
                      </TableCell>
                      <TableCell>{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>{getOrderStatusText(order.orderStatus)}</TableCell>
                      <TableCell>{getPaymentStatusText(order.paymentStatus)}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="outline" size="sm">
                            Xem
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {orders && Array.isArray(orders) && orders.length === 0 ? (
                <>
                  <p className="mb-2">Không tìm thấy đơn hàng nào.</p>
                  <p className="text-sm">Có thể chưa có đơn hàng nào được tạo.</p>
                </>
              ) : (
                <>
                  <p className="mb-2">Không thể tải danh sách đơn hàng.</p>
                  <p className="text-sm">Vui lòng thử lại sau hoặc kiểm tra kết nối.</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

