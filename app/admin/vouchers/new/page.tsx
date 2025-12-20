"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoucherForm, type VoucherFormValues } from "../VoucherForm";
import { useAdminCreateVoucher } from "@/lib/api/hooks";
import { toast } from "sonner";

export default function AdminVoucherCreatePage() {
  const router = useRouter();
  const createVoucher = useAdminCreateVoucher();

  const handleSubmit = async (values: VoucherFormValues) => {
    try {
      // Backend expect: các field nullable nếu = 0 hoặc null thì gửi null
      // Date đã được convert sang ISO 8601 trong VoucherForm.handleFormSubmit
      await createVoucher.mutateAsync({
        code: values.code.trim(),
        name: values.name.trim(),
        description: values.description?.trim() || null,
        discountType: values.discountType,
        discountValue: values.discountValue,
        maxDiscountAmount: values.maxDiscountAmount ?? null,
        minOrderAmount: values.minOrderAmount ?? null,
        startDate: values.startDate || null,
        endDate: values.endDate || null,
        isPublic: values.isPublic,
        usageLimitTotal: values.usageLimitTotal ?? null,
        usageLimitPerCustomer: values.usageLimitPerCustomer ?? null,
      });
      toast.success("Tạo voucher thành công");
      router.push("/admin/vouchers");
    } catch (error: any) {
      toast.error(error?.message || "Không thể tạo voucher");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Tạo mã giảm giá mới</CardTitle>
        </CardHeader>
        <CardContent>
          <VoucherForm onSubmit={handleSubmit} loading={createVoucher.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
