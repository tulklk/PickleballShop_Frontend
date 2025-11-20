"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart, useCreateOrder, useCreatePayment } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectItem } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { toast } from "sonner";
import { RequireAuth } from "@/lib/auth/guards";
import { PaymentMethod } from "@/lib/api/types";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phoneNumber: z.string().min(10, "Phone number is required"),
  addressLine: z.string().min(5, "Address is required"),
  ward: z.string().min(1, "Ward is required"),
  district: z.string().min(1, "District is required"),
  city: z.string().min(1, "City is required"),
  paymentMethod: z.nativeEnum(PaymentMethod),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const { data: cart } = useCart();
  const createOrder = useCreateOrder();
  const createPayment = useCreatePayment();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: PaymentMethod.COD,
    },
  });

  const paymentMethod = watch("paymentMethod");

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      // Create order
      const order = await createOrder.mutateAsync({
        shippingAddress: {
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          addressLine: data.addressLine,
          ward: data.ward,
          district: data.district,
          city: data.city,
        },
        paymentMethod: data.paymentMethod,
      });

      // If payment method is not COD, create payment
      if (data.paymentMethod !== PaymentMethod.COD && order.id) {
        const paymentResponse = await createPayment.mutateAsync(order.id);
        if (paymentResponse.paymentUrl) {
          window.location.href = paymentResponse.paymentUrl;
          return;
        }
      }

      toast.success("Order created successfully!");
      router.push(`/account/orders/${order.id}`);
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create order");
    }
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button onClick={() => router.push("/products")}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" {...register("fullName")} />
                  {errors.fullName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input id="phoneNumber" {...register("phoneNumber")} />
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.phoneNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="addressLine">Address Line</Label>
                  <Input id="addressLine" {...register("addressLine")} />
                  {errors.addressLine && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.addressLine.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="ward">Ward</Label>
                    <Input id="ward" {...register("ward")} />
                    {errors.ward && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.ward.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="district">District</Label>
                    <Input id="district" {...register("district")} />
                    {errors.district && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.district.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" {...register("city")} />
                    {errors.city && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    id="paymentMethod"
                    value={paymentMethod?.toString()}
                    onValueChange={(value) =>
                      setValue("paymentMethod", parseInt(value) as PaymentMethod)
                    }
                  >
                    <SelectItem value={PaymentMethod.COD.toString()}>
                      Cash on Delivery (COD)
                    </SelectItem>
                    <SelectItem value={PaymentMethod.MoMo.toString()}>
                      MoMo
                    </SelectItem>
                    <SelectItem value={PaymentMethod.VNPay.toString()}>
                      VNPay
                    </SelectItem>
                  </Select>
                  {errors.paymentMethod && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.paymentMethod.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={createOrder.isPending || createPayment.isPending}
                >
                  {createOrder.isPending || createPayment.isPending
                    ? "Processing..."
                    : "Place Order"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.productName} x {item.quantity}
                    </span>
                    <span>{formatCurrency(item.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(cart.subTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

