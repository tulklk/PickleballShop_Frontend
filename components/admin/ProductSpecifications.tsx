"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import type { ProductSpecification, CreateProductSpecificationRequest } from "@/lib/api/types";
import {
  useAdminProductSpecifications,
  useAdminCreateProductSpecification,
  useAdminUpdateProductSpecification,
  useAdminDeleteProductSpecification,
  useAdminBulkUpdateProductSpecifications,
} from "@/lib/api/hooks";

interface ProductSpecificationsProps {
  productId: string;
}

export function ProductSpecifications({ productId }: ProductSpecificationsProps) {
  const { data: specifications = [], isLoading } = useAdminProductSpecifications(productId);
  const createSpec = useAdminCreateProductSpecification();
  const updateSpec = useAdminUpdateProductSpecification();
  const deleteSpec = useAdminDeleteProductSpecification();
  const bulkUpdate = useAdminBulkUpdateProductSpecifications();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSpec, setNewSpec] = useState<CreateProductSpecificationRequest>({
    key: "",
    value: "",
    displayOrder: 0,
  });
  const [localSpecs, setLocalSpecs] = useState<ProductSpecification[]>([]);

  useEffect(() => {
    if (specifications) {
      setLocalSpecs([...specifications].sort((a, b) => a.displayOrder - b.displayOrder));
    }
  }, [specifications]);

  const handleAdd = async () => {
    if (!newSpec.key.trim() || !newSpec.value.trim()) {
      toast.error("Vui lòng nhập đầy đủ Key và Value");
      return;
    }

    try {
      const nextOrder = localSpecs.length > 0 
        ? Math.max(...localSpecs.map(s => s.displayOrder)) + 1 
        : 1;
      await createSpec.mutateAsync({
        productId,
        data: { ...newSpec, displayOrder: nextOrder },
      });
      setNewSpec({ key: "", value: "", displayOrder: 0 });
      toast.success("Đã thêm thông số kỹ thuật");
    } catch (error: any) {
      toast.error(error?.message || "Không thể thêm thông số kỹ thuật");
    }
  };

  const handleUpdate = async (spec: ProductSpecification, key: string, value: string) => {
    try {
      await updateSpec.mutateAsync({
        productId,
        specificationId: spec.id,
        data: {
          key: key || spec.key,
          value: value || spec.value,
          displayOrder: spec.displayOrder,
        },
      });
      setEditingId(null);
      toast.success("Đã cập nhật thông số kỹ thuật");
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật thông số kỹ thuật");
    }
  };

  const handleDelete = async (specId: string) => {
    if (!confirm("Bạn có chắc muốn xóa thông số kỹ thuật này?")) return;
    try {
      await deleteSpec.mutateAsync({ productId, specificationId: specId });
      toast.success("Đã xóa thông số kỹ thuật");
    } catch (error: any) {
      toast.error(error?.message || "Không thể xóa thông số kỹ thuật");
    }
  };

  const handleBulkUpdate = async () => {
    if (localSpecs.length === 0) {
      toast.error("Chưa có thông số kỹ thuật nào");
      return;
    }

    try {
      await bulkUpdate.mutateAsync({
        productId,
        data: {
          specifications: localSpecs.map((spec, index) => ({
            key: spec.key,
            value: spec.value,
            displayOrder: index + 1,
          })),
        },
      });
      toast.success("Đã cập nhật thứ tự hiển thị");
    } catch (error: any) {
      toast.error(error?.message || "Không thể cập nhật thứ tự");
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...localSpecs];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setLocalSpecs(updated);
  };

  const moveDown = (index: number) => {
    if (index === localSpecs.length - 1) return;
    const updated = [...localSpecs];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setLocalSpecs(updated);
  };

  if (isLoading) {
    return (
      <Card className="border-emerald-100">
        <CardHeader>
          <CardTitle>Thông số kỹ thuật</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Đang tải...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Thông số kỹ thuật</CardTitle>
          {localSpecs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkUpdate}
              disabled={bulkUpdate.isPending}
            >
              {bulkUpdate.isPending ? "Đang lưu..." : "Lưu thứ tự"}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form thêm mới */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
          <div>
            <Label htmlFor="new-key">Key *</Label>
            <Input
              id="new-key"
              value={newSpec.key}
              onChange={(e) => setNewSpec({ ...newSpec, key: e.target.value })}
              placeholder="Ví dụ: Trọng lượng"
            />
          </div>
          <div>
            <Label htmlFor="new-value">Value *</Label>
            <Input
              id="new-value"
              value={newSpec.value}
              onChange={(e) => setNewSpec({ ...newSpec, value: e.target.value })}
              placeholder="Ví dụ: 7.8 - 8.2 oz"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAdd}
              disabled={createSpec.isPending || !newSpec.key.trim() || !newSpec.value.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm
            </Button>
          </div>
        </div>

        {/* Danh sách thông số */}
        {localSpecs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Chưa có thông số kỹ thuật nào. Vui lòng thêm thông số ở trên.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Thứ tự</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-32">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {localSpecs.map((spec, index) => (
                  <TableRow key={spec.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveUp(index)}
                          disabled={index === 0}
                          className="p-1 hover:bg-emerald-100 rounded disabled:opacity-30"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                        <span className="text-sm font-medium">{spec.displayOrder}</span>
                        <button
                          type="button"
                          onClick={() => moveDown(index)}
                          disabled={index === localSpecs.length - 1}
                          className="p-1 hover:bg-emerald-100 rounded disabled:opacity-30"
                        >
                          <GripVertical className="h-4 w-4 rotate-90" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingId === spec.id ? (
                        <Input
                          defaultValue={spec.key}
                          onBlur={(e) => {
                            if (e.target.value !== spec.key) {
                              handleUpdate(spec, e.target.value, spec.value);
                            } else {
                              setEditingId(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-emerald-600"
                          onClick={() => setEditingId(spec.id)}
                        >
                          {spec.key}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === spec.id ? (
                        <Input
                          defaultValue={spec.value}
                          onBlur={(e) => {
                            if (e.target.value !== spec.value) {
                              handleUpdate(spec, spec.key, e.target.value);
                            } else {
                              setEditingId(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:text-emerald-600"
                          onClick={() => setEditingId(spec.id)}
                        >
                          {spec.value}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleDelete(spec.id)}
                        disabled={deleteSpec.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
