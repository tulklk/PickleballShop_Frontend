"use client";

import { useState } from "react";
import { useUsers, useUpdateUser, useDeleteUser } from "@/lib/api/hooks";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Edit, Trash2, UserCheck, UserX, Mail, Phone } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils/formatDate";

const updateUserSchema = z.object({
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  fullName: z.string().min(1, "Họ tên không được để trống").optional().or(z.literal("")),
  phoneNumber: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export default function AdminUsersPage() {
  const { data: users, isLoading, error } = useUsers();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [userToEdit, setUserToEdit] = useState<any>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
  });

  const isActive = watch("isActive");

  const handleEditClick = (user: any) => {
    setUserToEdit(user);
    reset({
      email: user.email || "",
      fullName: user.fullName || "",
      phoneNumber: user.phoneNumber || "",
      isActive: user.isActive ?? true,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setSelectedUser({ id: user.id, name: user.fullName || user.email || "User" });
    setDeleteDialogOpen(true);
  };

  const handleEditSubmit = async (data: UpdateUserFormData) => {
    if (!userToEdit) return;

    try {
      await updateUser.mutateAsync({
        id: userToEdit.id,
        data: {
          email: data.email || null,
          fullName: data.fullName || null,
          phoneNumber: data.phoneNumber || null,
          isActive: data.isActive,
        },
      });
      toast.success("Cập nhật thông tin người dùng thành công");
      setEditDialogOpen(false);
      setUserToEdit(null);
    } catch (error: any) {
      console.error("Update user error:", error);
      toast.error(error?.data?.message || "Có lỗi xảy ra khi cập nhật thông tin");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      await deleteUser.mutateAsync(selectedUser.id);
      toast.success("Đã xóa người dùng thành công");
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error("Delete user error:", error);
      toast.error(error?.data?.message || "Có lỗi xảy ra khi xóa người dùng");
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      await updateUser.mutateAsync({
        id: user.id,
        data: {
          isActive: !user.isActive,
        },
      });
      toast.success(
        user.isActive ? "Đã vô hiệu hóa người dùng" : "Đã kích hoạt người dùng"
      );
    } catch (error: any) {
      console.error("Toggle user status error:", error);
      toast.error(error?.data?.message || "Có lỗi xảy ra khi thay đổi trạng thái");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Không thể tải danh sách người dùng</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userList = Array.isArray(users) ? users : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Quản lý người dùng</h1>
        <p className="text-muted-foreground">
          Quản lý thông tin, trạng thái và quyền truy cập của người dùng
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả người dùng ({userList.length})</CardTitle>
          <CardDescription>
            Danh sách tất cả người dùng trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có người dùng nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userList.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {user.email || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>{user.fullName || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          {user.phoneNumber || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 2 ? "default" : "secondary"}>
                          {user.role === 1 ? "Khách hàng" : user.role === 2 ? "Admin" : "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={user.isActive ? "default" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            {user.isActive ? (
                              <>
                                <UserCheck className="h-3 w-3" />
                                Hoạt động
                              </>
                            ) : (
                              <>
                                <UserX className="h-3 w-3" />
                                Không hoạt động
                              </>
                            )}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(user)}
                            disabled={updateUser.isPending}
                            className="h-6 px-2"
                          >
                            {user.isActive ? (
                              <UserX className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <UserCheck className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? formatDate(user.createdAt) : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            disabled={updateUser.isPending || deleteUser.isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            disabled={updateUser.isPending || deleteUser.isPending}
                            className="text-destructive hover:text-destructive"
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin người dùng. Nhấn lưu để áp dụng thay đổi.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleEditSubmit)}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...register("email")}
                  placeholder="Nhập email"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Họ và tên *</Label>
                <Input
                  id="edit-fullName"
                  {...register("fullName")}
                  placeholder="Nhập họ và tên"
                />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber">Số điện thoại</Label>
                <Input
                  id="edit-phoneNumber"
                  {...register("phoneNumber")}
                  placeholder="Nhập số điện thoại"
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="edit-isActive" className="flex-1">
                  Trạng thái hoạt động
                </Label>
                <Switch
                  id="edit-isActive"
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("isActive", checked)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setUserToEdit(null);
                }}
                disabled={updateUser.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateUser.isPending}>
                {updateUser.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Xóa người dùng"
        description={`Bạn có chắc chắn muốn xóa người dùng "${selectedUser?.name}"? Hành động này không thể hoàn tác.`}
        isDeleting={deleteUser.isPending}
      />
    </div>
  );
}

