"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { DiscountType, Voucher } from "@/lib/api/types";

const voucherSchema = z.object({
  code: z.string().min(1, "Mã giảm giá là bắt buộc"),
  name: z.string().min(1, "Tên voucher là bắt buộc"),
  description: z.string().optional().nullable(),
  discountType: z.enum(["Percent", "Fixed"]).or(z.string()),
  discountValue: z
    .number({ invalid_type_error: "Giá trị giảm phải là số" })
    .positive("Giá trị giảm phải lớn hơn 0"),
  maxDiscountAmount: z
    .number({ invalid_type_error: "Giảm tối đa phải là số" })
    .nullable()
    .optional(),
  minOrderAmount: z
    .number({ invalid_type_error: "Đơn tối thiểu phải là số" })
    .nullable()
    .optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
  usageLimitTotal: z
    .number({ invalid_type_error: "Giới hạn tổng phải là số" })
    .int()
    .min(0)
    .nullable()
    .optional(),
  usageLimitPerCustomer: z
    .number({ invalid_type_error: "Giới hạn mỗi khách phải là số" })
    .int()
    .min(0)
    .nullable()
    .optional(),
});

export type VoucherFormValues = z.infer<typeof voucherSchema>;

interface VoucherFormProps {
  initialData?: Voucher | null;
  onSubmit: (values: VoucherFormValues) => Promise<void>;
  loading?: boolean;
}

export function VoucherForm({ initialData, onSubmit, loading }: VoucherFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<VoucherFormValues>({
    resolver: zodResolver(voucherSchema),
    defaultValues: initialData
      ? {
          code: initialData.code,
          name: initialData.name,
          description: initialData.description ?? "",
          discountType:
            typeof initialData.discountType === "string"
              ? (initialData.discountType as DiscountType)
              : "Percent",
          discountValue: Number(initialData.discountValue || 0),
          maxDiscountAmount: initialData.maxDiscountAmount ?? null,
          minOrderAmount: initialData.minOrderAmount ?? null,
          startDate: initialData.startDate ? initialData.startDate.slice(0, 16) : "",
          endDate: initialData.endDate ? initialData.endDate.slice(0, 16) : "",
          isPublic: initialData.isPublic,
          usageLimitTotal: initialData.usageLimitTotal ?? null,
          usageLimitPerCustomer: initialData.usageLimitPerCustomer ?? null,
        }
      : {
          code: "",
          name: "",
          description: "",
          discountType: "Percent",
          discountValue: 5,
          maxDiscountAmount: null,
          minOrderAmount: null,
          startDate: "",
          endDate: "",
          isPublic: false,
          usageLimitTotal: null,
          usageLimitPerCustomer: null,
        },
  });

  const discountType = watch("discountType");

  const handleFormSubmit = async (values: VoucherFormValues) => {
    const payload: VoucherFormValues = {
      ...values,
      discountValue: Number(values.discountValue) || 0,
      maxDiscountAmount:
        values.maxDiscountAmount !== null && values.maxDiscountAmount !== undefined
          ? Number(values.maxDiscountAmount)
          : null,
      minOrderAmount:
        values.minOrderAmount !== null && values.minOrderAmount !== undefined
          ? Number(values.minOrderAmount)
          : null,
      usageLimitTotal:
        values.usageLimitTotal !== null && values.usageLimitTotal !== undefined
          ? Number(values.usageLimitTotal)
          : null,
      usageLimitPerCustomer:
        values.usageLimitPerCustomer !== null && values.usageLimitPerCustomer !== undefined
          ? Number(values.usageLimitPerCustomer)
          : null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Thông tin cơ bản</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Mã giảm giá</Label>
              <Input id="code" {...register("code")} disabled={!!initialData} />
              {errors.code && (
                <p className="text-sm text-destructive mt-1">{errors.code.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="name">Tên hiển thị</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thiết lập giảm giá</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="discountType">Loại giảm</Label>
              <select
                id="discountType"
                className="w-full border rounded-md px-3 py-2 text-sm"
                value={discountType as any}
                onChange={(e) => setValue("discountType", e.target.value as any)}
              >
                <option value="Percent">Phần trăm (%)</option>
                <option value="Fixed">Số tiền cố định</option>
              </select>
            </div>
            <div>
              <Label htmlFor="discountValue">Giá trị giảm</Label>
              <Input
                id="discountValue"
                type="number"
                step="0.01"
                {...register("discountValue", { valueAsNumber: true })}
              />
              {errors.discountValue && (
                <p className="text-sm text-destructive mt-1">{errors.discountValue.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="maxDiscountAmount">Giảm tối đa (đơn)</Label>
              <Input
                id="maxDiscountAmount"
                type="number"
                step="0.01"
                {...register("maxDiscountAmount", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="minOrderAmount">Giá trị đơn tối thiểu</Label>
              <Input
                id="minOrderAmount"
                type="number"
                step="0.01"
                {...register("minOrderAmount", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="usageLimitTotal">Giới hạn tổng số lần dùng</Label>
              <Input
                id="usageLimitTotal"
                type="number"
                {...register("usageLimitTotal", { valueAsNumber: true })}
              />
            </div>
            <div>
              <Label htmlFor="usageLimitPerCustomer">Giới hạn / khách hàng</Label>
              <Input
                id="usageLimitPerCustomer"
                type="number"
                {...register("usageLimitPerCustomer", { valueAsNumber: true })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Thời gian hiệu lực & Trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Ngày bắt đầu</Label>
              <Input id="startDate" type="datetime-local" {...register("startDate")} />
            </div>
            <div>
              <Label htmlFor="endDate">Ngày kết thúc</Label>
              <Input id="endDate" type="datetime-local" {...register("endDate")} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="isPublic"
              checked={watch("isPublic")}
              onCheckedChange={(checked) => setValue("isPublic", checked)}
            />
            <Label htmlFor="isPublic">Public (hiển thị cho khách)</Label>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="mt-4">
        {loading ? "Đang lưu..." : "Lưu voucher"}
      </Button>
    </form>
  );
}
