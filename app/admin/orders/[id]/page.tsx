"use client";

import { useParams } from "next/navigation";
import { useAdminOrder, useAdminUpdateOrderStatus } from "@/lib/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDateTime } from "@/lib/utils/formatDate";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { OrderStatus } from "@/lib/api/types";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { data: order, isLoading } = useAdminOrder(orderId);
  const updateOrderStatus = useAdminUpdateOrderStatus();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | undefined>();

  const handleUpdateStatus = async () => {
    if (!selectedStatus) return;

    try {
      await updateOrderStatus.mutateAsync({
        id: orderId,
        data: { orderStatus: selectedStatus },
      });
      toast.success("Order status updated");
      setSelectedStatus(undefined);
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading order details...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Order not found.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order Details</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="font-medium">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">{formatDateTime(order.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{order.orderStatus}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <p className="font-medium">{order.paymentStatus}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Method</p>
              <p className="font-medium">{order.paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-bold text-lg text-primary">
                {formatCurrency(order.totalAmount)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium">{order.shippingAddress.fullName}</p>
            <p className="text-muted-foreground">
              {order.shippingAddress.phoneNumber}
            </p>
            <p className="text-muted-foreground">
              {order.shippingAddress.addressLine}
            </p>
            <p className="text-muted-foreground">
              {order.shippingAddress.ward}, {order.shippingAddress.district}, {order.shippingAddress.city}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b pb-4"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(item.unitPrice)} x {item.quantity}
                  </p>
                  <p className="text-primary font-bold">
                    {formatCurrency(item.lineTotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update Order Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              className="w-64"
              value={selectedStatus?.toString()}
              onValueChange={(value) =>
                setSelectedStatus(parseInt(value) as OrderStatus)
              }
            >
              <SelectItem value={OrderStatus.Pending.toString()}>
                Pending
              </SelectItem>
              <SelectItem value={OrderStatus.Processing.toString()}>
                Processing
              </SelectItem>
              <SelectItem value={OrderStatus.Shipped.toString()}>
                Shipped
              </SelectItem>
              <SelectItem value={OrderStatus.Completed.toString()}>
                Completed
              </SelectItem>
              <SelectItem value={OrderStatus.Cancelled.toString()}>
                Cancelled
              </SelectItem>
            </Select>
            <Button
              onClick={handleUpdateStatus}
              disabled={!selectedStatus || updateOrderStatus.isPending}
            >
              Update Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

