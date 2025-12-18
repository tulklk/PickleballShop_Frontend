"use client";

import { useState } from "react";
import Link from "next/link";
import { useAdminVouchers, useAdminDeleteVoucher, useAdminPublishVoucher } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { formatDate } from "@/lib/utils/formatDate";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, ToggleLeft, ToggleRight, Percent } from "lucide-react";
import type { Voucher } from "@/lib/api/types";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";

function getDiscountLabel(voucher: Voucher) {
  if (typeof voucher.discountType === "string") {
    const type = voucher.discountType.toLowerCase();
    if (type.includes("percent")) {
      return `${voucher.discountValue}%`;
    }
  }
  return formatCurrency(voucher.discountValue);
}

export default function AdminVouchersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyPublic, setOnlyPublic] = useState<boolean | null>(null);

  const { data, isLoading } = useAdminVouchers({
    Page: 1,
    PageSize: 100,
    SearchTerm: searchTerm || undefined,
    IsPublished: onlyPublic,
  } as any);

  const deleteVoucher = useAdminDeleteVoucher();
  const publishVoucher = useAdminPublishVoucher();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);

  const vouchers = data?.items || [];

  const handleDeleteClick = (voucher: Voucher) => {
    setVoucherToDelete(voucher);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!voucherToDelete) return;
    try {
      await deleteVoucher.mutateAsync(voucherToDelete.id);
      toast.success("Đã xóa mã giảm giá");
      setDeleteDialogOpen(false);
      setVoucherToDelete(null);
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa mã giảm giá");
    }
  };

  const handleTogglePublish = async (voucher: Voucher) => {
    try {
      await publishVoucher.mutateAsync({ id: voucher.id, isPublic: !voucher.isPublic });
      toast.success(!voucher.isPublic ? "Đã publish voucher" : "Đã ẩn voucher");
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật trạng thái voucher");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-500">Quản lý khuyến mãi</p>
          <h1 className="text-3xl font-bold text-emerald-950">Mã giảm giá</h1>
          <p className="text-sm text-emerald-900/80">Danh sách mã giảm giá đang áp dụng cho cửa hàng.</p>
        </div>
        <div>
          <Link href="/admin/vouchers/new">
            <Button className="bg-emerald-500 text-white hover:bg-emerald-400">
              <Plus className="mr-2 h-4 w-4" />
              Tạo mã giảm giá
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-emerald-100 bg-white/95 shadow-[0_20px_60px_rgba(15,118,110,0.1)]">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:w-80">
            <Label
              htmlFor="voucher-search"
              className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500"
            >
              Tìm kiếm voucher
            </Label>
            <Input
              id="voucher-search"
              placeholder="Tìm theo mã, tên voucher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant={onlyPublic === null ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyPublic(null)}
            >
              Tất cả
            </Button>
            <Button
              type="button"
              variant={onlyPublic === true ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyPublic(true)}
            >
              Đang public
            </Button>
            <Button
              type="button"
              variant={onlyPublic === false ? "default" : "outline"}
              size="sm"
              onClick={() => setOnlyPublic(false)}
            >
              Đang ẩn
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Đang tải danh sách voucher...</div>
          ) : vouchers.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Chưa có mã giảm giá nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Loại giảm</TableHead>
                    <TableHead>Giá trị</TableHead>
                    <TableHead>Đơn tối thiểu</TableHead>
                    <TableHead>Tối đa giảm</TableHead>
                    <TableHead>Hiệu lực</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.map((voucher) => (
                    <TableRow key={voucher.id}>
                      <TableCell className="font-mono font-semibold">{voucher.code}</TableCell>
                      <TableCell>{voucher.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Percent className="h-3 w-3" />
                          <span>{typeof voucher.discountType === "string" ? voucher.discountType : "Giảm giá"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getDiscountLabel(voucher)}</TableCell>
                      <TableCell>{voucher.minOrderAmount ? formatCurrency(voucher.minOrderAmount) : "—"}</TableCell>
                      <TableCell>{voucher.maxDiscountAmount ? formatCurrency(voucher.maxDiscountAmount) : "—"}</TableCell>
                      <TableCell className="text-xs">
                        {voucher.startDate && (
                          <div>Từ: {formatDate(voucher.startDate)}</div>
                        )}
                        {voucher.endDate && (
                          <div>Đến: {formatDate(voucher.endDate)}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {voucher.isPublic ? (
                          <Badge className="bg-emerald-500">Đang public</Badge>
                        ) : (
                          <Badge variant="outline" className="border-gray-300 text-gray-700">
                            Đang ẩn
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleTogglePublish(voucher)}
                            title={voucher.isPublic ? "Ẩn voucher" : "Publish voucher"}
                          >
                            {voucher.isPublic ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/admin/vouchers/${voucher.id}`} className="inline-flex">
                            <Button size="icon" variant="secondary">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => handleDeleteClick(voucher)}
                            disabled={deleteVoucher.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa voucher"
        description={
          voucherToDelete
            ? `Bạn có chắc chắn muốn xóa mã giảm giá "${voucherToDelete.code}"? Hành động này không thể hoàn tác.`
            : "Bạn có chắc chắn muốn xóa mã giảm giá này?"
        }
        confirmText="Xóa voucher"
        isLoading={deleteVoucher.isPending}
      />
    </div>
  );
}
