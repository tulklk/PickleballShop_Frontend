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
import { Plus, Edit, Trash2, ChevronDown, ChevronRight } from "lucide-react";
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: categories, isLoading, isError, error } = useAdminCategories();
  const deleteCategory = useAdminDeleteCategory();

  const toggleExpand = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

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

  // Helper function to collect all child category IDs from the tree
  const getAllChildIds = (categoryList: any[]): Set<string> => {
    const childIds = new Set<string>();
    
    const traverse = (cats: any[]) => {
      cats.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          cat.children.forEach((child: any) => {
            if (child.id) {
              childIds.add(child.id);
            }
            // Recursively check nested children
            if (child.children && child.children.length > 0) {
              traverse([child]);
            }
          });
        }
      });
    };
    
    traverse(categoryList);
    return childIds;
  };

  const renderRows = (category: any, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const childrenCount = category.children?.length || 0;
    const isChild = level > 0;

    return (
      <>
        <TableRow key={category.id} className={isChild ? "bg-gray-50/50" : ""}>
          <TableCell className={`font-medium ${isChild ? "text-sm text-gray-700 pl-8" : ""}`}>
            <div className="flex items-center gap-2">
              {isChild && <span className="text-gray-400">↳</span>}
              {hasChildren && !isChild && (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="flex items-center justify-center w-5 h-5 hover:bg-gray-200 rounded transition-colors"
                  title={isExpanded ? "Thu gọn" : "Mở rộng"}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                  )}
                </button>
              )}
              {!hasChildren && !isChild && (
                <span className="text-gray-400 w-5"></span>
              )}
              <span>
                {category.name || "Không có tên"}
                {hasChildren && !isChild && (
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    ({childrenCount} danh mục)
                  </span>
                )}
              </span>
            </div>
          </TableCell>
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
        {hasChildren && isExpanded && (
          <>
            {category.children.map((child: any) => renderRows(child, level + 1))}
          </>
        )}
      </>
    );
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
          <CardDescription>
            Quản lý danh mục sản phẩm (danh mục gốc và danh mục con)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories && categories.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  // Get all child IDs to filter them out from top level
                  const childIds = getAllChildIds(categories || []);
                  // Only render top-level categories (not children of other categories)
                  const topLevelCategories = (categories || []).filter(
                    (cat: any) => cat.id && !childIds.has(cat.id)
                  );
                  return topLevelCategories.map((category: any) => renderRows(category, 0));
                })()}
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

