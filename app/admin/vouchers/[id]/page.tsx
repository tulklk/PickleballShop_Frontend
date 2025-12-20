"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoucherForm, type VoucherFormValues } from "../VoucherForm";
import { useAdminVoucher, useAdminUpdateVoucher } from "@/lib/api/hooks";
import { toast } from "sonner";

export default function AdminVoucherEditPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data: voucher, isLoading } = useAdminVoucher(id);
  const updateVoucher = useAdminUpdateVoucher();

  const handleSubmit = async (values: VoucherFormValues) => {
    try {
      // Backend expect: các field nullable nếu = 0 hoặc null thì gửi null
      // Date đã được convert sang ISO 8601 trong VoucherForm.handleFormSubmit
      await updateVoucher.mutateAsync({
        id,
        data: {
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
        },
      });
      toast.success("Cập nhật voucher thành công");
      router.push("/admin/vouchers");
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật voucher");
    }
  };

  if (isLoading || !voucher) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Đang tải voucher...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Chỉnh sửa mã giảm giá</CardTitle>
        </CardHeader>
        <CardContent>
          <VoucherForm initialData={voucher} onSubmit={handleSubmit} loading={updateVoucher.isPending} />
        </CardContent>
      </Card>
    </div>
  );
}
