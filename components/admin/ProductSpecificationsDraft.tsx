"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export interface DraftSpec {
  key: string;
  value: string;
}

interface ProductSpecificationsDraftProps {
  value: DraftSpec[];
  onChange: (specs: DraftSpec[]) => void;
}

export function ProductSpecificationsDraft({ value, onChange }: ProductSpecificationsDraftProps) {
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    const k = newKey.trim();
    const v = newValue.trim();
    if (!k || !v) {
      toast.error("Vui lòng nhập đầy đủ Key và Value");
      return;
    }
    onChange([...value, { key: k, value: v }]);
    setNewKey("");
    setNewValue("");
    toast.success("Đã thêm thông số kỹ thuật");
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <Card className="border-emerald-100">
      <CardHeader>
        <CardTitle>Thông số kỹ thuật</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
          <div>
            <Label htmlFor="draft-spec-key">Key *</Label>
            <Input
              id="draft-spec-key"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Ví dụ: Trọng lượng"
            />
          </div>
          <div>
            <Label htmlFor="draft-spec-value">Value *</Label>
            <Input
              id="draft-spec-value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Ví dụ: 7.8 - 8.2 oz"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleAdd}
              disabled={!newKey.trim() || !newValue.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm
            </Button>
          </div>
        </div>

        {value.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Chưa có thông số kỹ thuật nào. Vui lòng thêm thông số ở trên.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-32">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {value.map((spec, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-sm font-medium">{index + 1}</TableCell>
                    <TableCell>{spec.key}</TableCell>
                    <TableCell>{spec.value}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => handleRemove(index)}
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
