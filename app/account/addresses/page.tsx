"use client";

import { useEffect, useState } from "react";
import { useUserMe } from "@/lib/api/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Star, Trash2, Plus, Home } from "lucide-react";
import { toast } from "sonner";
import type { SavedAddress } from "@/lib/utils/userAddresses";
import {
  getUserAddresses,
  upsertUserAddress,
  deleteUserAddress,
  setDefaultUserAddress,
} from "@/lib/utils/userAddresses";
import { Select, SelectItem } from "@/components/ui/select";
import type { Province, District, Ward } from "@/lib/utils/provinces";
import { getProvinces, getDistricts, getWards } from "@/lib/utils/provinces";

export default function AccountAddressesPage() {
  return <AccountAddressesContent />;
}

function AccountAddressesContent() {
  const { data: user, isLoading } = useUserMe();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [editing, setEditing] = useState<SavedAddress | null>(null);

  // State cho dropdown tỉnh/thành, quận/huyện, phường/xã (dùng chung API với trang checkout)
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);
  const [selectedCityName, setSelectedCityName] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [selectedWardName, setSelectedWardName] = useState("");
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setAddresses(getUserAddresses(user.id));
    }
  }, [user?.id]);

  // Load provinces
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setIsLoadingProvinces(true);
        const data = await getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to load provinces for account addresses:", error);
        toast.error("Không thể tải danh sách tỉnh/thành phố. Vui lòng thử lại.");
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  // Khi chọn tỉnh/thành phố → load quận/huyện
  useEffect(() => {
    const loadDistrictsForProvince = async () => {
      if (!selectedProvinceCode) {
        setDistricts([]);
        setWards([]);
        setSelectedDistrictName("");
        setSelectedWardName("");
        return;
      }

      try {
        setIsLoadingDistricts(true);
        setDistricts([]);
        setWards([]);
        setSelectedDistrictName("");
        setSelectedWardName("");

        const fetched = await getDistricts(selectedProvinceCode);
        setDistricts(fetched);
      } catch (error) {
        console.error("Failed to load districts for account addresses:", error);
        toast.error("Không thể tải danh sách quận/huyện. Vui lòng thử lại.");
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    loadDistrictsForProvince();
  }, [selectedProvinceCode]);

  // Khi chọn quận/huyện → load phường/xã
  useEffect(() => {
    const loadWardsForDistrict = async () => {
      if (!selectedDistrictCode) {
        setWards([]);
        setSelectedWardName("");
        return;
      }

      try {
        setIsLoadingWards(true);
        setWards([]);
        setSelectedWardName("");

        const fetched = await getWards(selectedDistrictCode);
        setWards(fetched);
      } catch (error) {
        console.error("Failed to load wards for account addresses:", error);
        toast.error("Không thể tải danh sách phường/xã. Vui lòng thử lại.");
      } finally {
        setIsLoadingWards(false);
      }
    };

    loadWardsForDistrict();
  }, [selectedDistrictCode]);

  // Khi chuyển sang chế độ sửa, cố gắng map city/district/ward sang dropdown tương ứng
  useEffect(() => {
    if (!editing || provinces.length === 0) return;

    // Tỉnh/thành phố
    if (editing.city) {
      const province = provinces.find((p) => p.name === editing.city);
      if (province) {
        setSelectedProvinceCode(province.code);
        setSelectedCityName(province.name);
      }
    }
  }, [editing, provinces]);

  // Khi đã có districts và đang sửa, map district name
  useEffect(() => {
    if (!editing || !editing.district || districts.length === 0) return;
    const district = districts.find((d) => d.name === editing.district);
    if (district) {
      setSelectedDistrictCode(district.code);
      setSelectedDistrictName(district.name);
    }
  }, [editing, districts]);

  // Khi đã có wards và đang sửa, map ward name
  useEffect(() => {
    if (!editing || !editing.ward || wards.length === 0) return;
    const ward = wards.find((w) => w.name === editing.ward);
    if (ward) {
      setSelectedWardName(ward.name);
    }
  }, [editing, wards]);

  if (isLoading || !user) {
    return (
      <div className="container mx-auto px-4 py-10 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user.id) return;

    const formData = new FormData(e.currentTarget);
    const payload = {
      id: editing?.id,
      fullName: (formData.get("fullName") as string) || "",
      phoneNumber: (formData.get("phoneNumber") as string) || "",
      addressLine: (formData.get("addressLine") as string) || "",
      ward: selectedWardName || "",
      district: selectedDistrictName || "",
      city: selectedCityName || "",
      isDefault: formData.get("isDefault") === "on",
    };

    if (!payload.fullName || !payload.phoneNumber || !payload.addressLine || !payload.city) {
      toast.error("Vui lòng nhập ít nhất Họ tên, SĐT, Địa chỉ và Tỉnh/Thành phố");
      return;
    }

    const updated = upsertUserAddress(user.id, payload);
    setAddresses(updated);
    setEditing(null);
    (e.currentTarget as HTMLFormElement).reset();
    toast.success("Đã lưu địa chỉ giao hàng");
  };

  const startEdit = (addr?: SavedAddress) => {
    setEditing(addr || null);
  };

  const handleDelete = (addr: SavedAddress) => {
    if (!user.id) return;
    if (!confirm(`Bạn có chắc muốn xóa địa chỉ \"${addr.addressLine}\"?`)) return;
    const updated = deleteUserAddress(user.id, addr.id);
    setAddresses(updated);
    toast.success("Đã xóa địa chỉ");
  };

  const handleSetDefault = (addr: SavedAddress) => {
    if (!user.id) return;
    const updated = setDefaultUserAddress(user.id, addr.id);
    setAddresses(updated);
    toast.success("Đã đặt làm địa chỉ mặc định");
  };

  const currentEditing = editing;

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <Card className="border-emerald-100 bg-white shadow-[0_20px_60px_rgba(16,185,129,0.12)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-emerald-900">
            <MapPin className="h-5 w-5" />
            Địa chỉ giao hàng
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 lg:grid-cols-[3fr_2fr]">
          {/* Danh sách địa chỉ */}
          <div className="space-y-4">
            {addresses.length === 0 ? (
              <p className="text-sm text-slate-600">
                Bạn chưa lưu địa chỉ nào. Vui lòng thêm địa chỉ giao hàng để thao tác nhanh ở bước thanh toán.
              </p>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-900 flex items-center gap-1">
                        <Home className="h-4 w-4" />
                        {addr.fullName}
                      </span>
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
                          <Star className="h-3 w-3" />
                          Mặc định
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-700">SĐT: {addr.phoneNumber}</p>
                    <p className="text-sm text-slate-700">
                      {addr.addressLine}, {addr.ward && `${addr.ward}, `}{addr.district && `${addr.district}, `}
                      {addr.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-end">
                    {!addr.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => handleSetDefault(addr)}
                      >
                        Đặt mặc định
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(addr)}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(addr)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form thêm / sửa địa chỉ */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-emerald-900 text-lg">
                {currentEditing ? "Cập nhật địa chỉ" : "Thêm địa chỉ mới"}
              </h3>
              {currentEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditing(null)}
                  className="text-sm"
                >
                  <Plus className="h-3 w-3 mr-1" /> Địa chỉ mới
                </Button>
              )}
            </div>

            <form className="space-y-3" onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fullName">Họ và tên *</Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    defaultValue={currentEditing?.fullName || user.fullName || ""}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phoneNumber">Số điện thoại *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    defaultValue={currentEditing?.phoneNumber || user.phoneNumber || ""}
                    placeholder="098xxxxxxx"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="addressLine">Địa chỉ *</Label>
                <Input
                  id="addressLine"
                  name="addressLine"
                  defaultValue={currentEditing?.addressLine || ""}
                  placeholder="Số nhà, tên đường..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Tỉnh / Thành phố */}
                <div className="space-y-1">
                  <Label htmlFor="city">Tỉnh/Thành phố *</Label>
                  <Select
                    id="city"
                    value={
                      selectedCityName && selectedProvinceCode
                        ? `${selectedProvinceCode}|${selectedCityName}`
                        : ""
                    }
                    onValueChange={(value) => {
                      if (!value) {
                        setSelectedProvinceCode(null);
                        setSelectedCityName("");
                        return;
                      }
                      const [codeStr, name] = value.split("|");
                      const code = parseInt(codeStr, 10);
                      setSelectedProvinceCode(code);
                      setSelectedCityName(name || "");
                    }}
                    disabled={isLoadingProvinces}
                    className="bg-white"
                  >
                    <SelectItem value="">Chọn tỉnh/thành phố</SelectItem>
                    {provinces.map((province) => (
                      <SelectItem
                        key={province.code}
                        value={`${province.code}|${province.name}`}
                      >
                        {province.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Quận / Huyện */}
                <div className="space-y-1">
                  <Label htmlFor="district">Quận/Huyện</Label>
                  <Select
                    id="district"
                    value={
                      selectedDistrictName && selectedDistrictCode
                        ? `${selectedDistrictCode}|${selectedDistrictName}`
                        : ""
                    }
                    onValueChange={(value) => {
                      if (!value) {
                        setSelectedDistrictCode(null);
                        setSelectedDistrictName("");
                        return;
                      }
                      const [codeStr, name] = value.split("|");
                      const code = parseInt(codeStr, 10);
                      setSelectedDistrictCode(code);
                      setSelectedDistrictName(name || "");
                    }}
                    disabled={!selectedProvinceCode || isLoadingDistricts || districts.length === 0}
                    className="bg-white"
                  >
                    <SelectItem value="">
                      {selectedProvinceCode
                        ? isLoadingDistricts
                          ? "Đang tải..."
                          : "Chọn quận/huyện"
                        : "Chọn tỉnh/thành phố trước"}
                    </SelectItem>
                    {districts.map((district) => (
                      <SelectItem
                        key={district.code}
                        value={`${district.code}|${district.name}`}
                      >
                        {district.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>

                {/* Phường / Xã */}
                <div className="space-y-1">
                  <Label htmlFor="ward">Phường/Xã</Label>
                  <Select
                    id="ward"
                    value={selectedWardName || ""}
                    onValueChange={(value) => {
                      setSelectedWardName(value);
                    }}
                    disabled={!selectedDistrictCode || isLoadingWards || wards.length === 0}
                    className="bg-white"
                  >
                    <SelectItem value="">
                      {selectedDistrictCode
                        ? isLoadingWards
                          ? "Đang tải..."
                          : "Chọn phường/xã"
                        : "Chọn quận/huyện trước"}
                    </SelectItem>
                    {wards.map((ward) => (
                      <SelectItem key={ward.code} value={ward.name}>
                        {ward.name}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="isDefault"
                  name="isDefault"
                  type="checkbox"
                  defaultChecked={currentEditing?.isDefault || addresses.length === 0}
                  className="h-4 w-4"
                />
                <Label htmlFor="isDefault" className="text-sm text-slate-700 cursor-pointer">
                  Đặt làm địa chỉ giao hàng mặc định
                </Label>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 px-6">
                  Lưu địa chỉ
                </Button>
              </div>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
