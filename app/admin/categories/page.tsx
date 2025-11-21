"use client";

import { useState } from "react";
import { useAdminCategories, useAdminDeleteCategory } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Edit, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog";

export default function AdminCategoriesPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState<string>("");

  const { data: categories, isLoading, isError, error } = useAdminCategories();
  const deleteCategory = useAdminDeleteCategory();

  const handleDeleteClick = (id: string, name: string) => {
    setCategoryToDelete(id);
    setCategoryName(name);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteCategory.mutateAsync(categoryToDelete);
      toast.success("Đã xóa danh mục thành công");
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      setCategoryName("");
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Không thể xóa danh mục";
      toast.error(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Đang tải danh mục...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive mb-2">Không thể tải danh mục</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Danh mục</h1>
        <Link href="/admin/categories/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Thêm danh mục
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tất cả danh mục</CardTitle>
          <CardDescription>Quản lý danh mục sản phẩm</CardDescription>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">
                      {category.name || "Không có tên"}
                    </TableCell>
                    <TableCell>{category.slug || "N/A"}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {category.description || "Không có mô tả"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link href={`/admin/categories/${category.id}`}>
                          <Button variant="outline" size="icon" title="Chỉnh sửa">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => handleDeleteClick(category.id, category.name || "danh mục này")}
                          title="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Chưa có danh mục nào. Hãy tạo danh mục đầu tiên!
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Xác nhận xóa danh mục"
        description={`Bạn có chắc chắn muốn xóa danh mục "${categoryName}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa danh mục"
        isLoading={deleteCategory.isPending}
      />
    </div>
  );
}

