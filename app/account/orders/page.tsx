"use client";

import { useMyOrders } from "@/lib/api/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RequireAuth } from "@/lib/auth/guards";

export default function OrdersPage() {
  return (
    <RequireAuth>
      <OrdersContent />
    </RequireAuth>
  );
}

function OrdersContent() {
  const { data: orders, isLoading } = useMyOrders();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">You have no orders yet.</p>
          <Link href="/products" className="mt-4 inline-block">
            <Button>Start Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    Order #{order.orderNumber}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatCurrency(order.totalAmount)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.orderStatus}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <div className="space-y-2">
                  {order.items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {item.productName} x {item.quantity}
                      </span>
                      <span>{formatCurrency(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  <p>Payment: {order.paymentStatus}</p>
                  <p>Method: {order.paymentMethod}</p>
                </div>
                <Link href={`/account/orders/${order.id}`}>
                  <Button variant="outline">View Details</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

