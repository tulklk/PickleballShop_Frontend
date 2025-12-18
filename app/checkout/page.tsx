"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCart, useCreateOrder, useCreatePayment, useCreateGuestOrder, useCreateGuestPayment, useUserMe, useApplyVoucherForUser, useApplyVoucherForGuest } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectItem } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils/formatCurrency";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/useAuth";
import { PaymentMethod } from "@/lib/api/types";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  ShoppingBag, 
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail
} from "lucide-react";
import { getProvinces, getDistricts, getWards, type Province, type District, type Ward } from "@/lib/utils/provinces";
import momoIcon from "@/app/img/momo_icon.png";
import vnpayLogo from "@/app/img/Logo-VNPAY-QR-350x65.png";
import { Building2 } from "lucide-react";

// Base schema - email is optional, will be validated conditionally
const checkoutSchema = z.object({
  fullName: z.string().min(2, "Vui lòng nhập họ tên"),
  phoneNumber: z.string().min(10, "Số điện thoại phải có ít nhất 10 số"),
  email: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  addressLine: z.string().min(5, "Vui lòng nhập địa chỉ"),
  ward: z.string().min(1, "Vui lòng nhập phường/xã"),
  district: z.string().min(1, "Vui lòng nhập quận/huyện"),
  city: z.string().min(1, "Vui lòng nhập thành phố"),
  paymentMethod: z.nativeEnum(PaymentMethod),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  return <CheckoutContent />;
}

function CheckoutContent() {
  const router = useRouter();
  const { data: cart, isLoading: isCartLoading } = useCart();
  const createOrder = useCreateOrder();
  const createPayment = useCreatePayment();
  const createGuestOrder = useCreateGuestOrder();
  const createGuestPayment = useCreateGuestPayment();
  const { user, isAuthenticated } = useAuth();
  const { data: userMe } = useUserMe();
  const applyVoucherUser = useApplyVoucherForUser();
  const applyVoucherGuest = useApplyVoucherForGuest();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: PaymentMethod.COD,
    },
  });

  const paymentMethod = watch("paymentMethod");
  const selectedCity = watch("city");
  const selectedDistrict = watch("district");
  const selectedWard = watch("ward");
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState<number | null>(null);

  // States for provinces API
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucherCode, setAppliedVoucherCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [finalTotal, setFinalTotal] = useState<number | null>(null);
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setIsLoadingProvinces(true);
        const data = await getProvinces();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to load provinces:", error);
        toast.error("Không thể tải danh sách tỉnh thành. Vui lòng thử lại.");
      } finally {
        setIsLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  // Load districts when province is selected
  useEffect(() => {
    const loadDistrictsForProvince = async () => {
      if (!selectedCity) {
        setDistricts([]);
        setWards([]);
        setValue("district", "");
        setValue("ward", "");
        return;
      }

      if (provinces.length === 0) {
        return; // Wait for provinces to load
      }

      // Use selectedProvinceCode if available, otherwise try to find by name
      let provinceCode = selectedProvinceCode;
      
      if (!provinceCode) {
        // Fallback: find province by name
        const normalizedSelectedCity = selectedCity.trim();
        const province = provinces.find((p) => {
          const normalizedProvinceName = (p.name || "").trim();
          return normalizedProvinceName === normalizedSelectedCity || 
                 normalizedProvinceName.toLowerCase() === normalizedSelectedCity.toLowerCase();
        });
        if (province) {
          provinceCode = province.code;
        }
      }

      if (!provinceCode) {
        console.warn("Province code not found for:", selectedCity);
        return;
      }

      try {
        setIsLoadingDistricts(true);
        setWards([]);
        setValue("district", "");
        setValue("ward", "");

        // Try to get districts from already loaded province first
        const province = provinces.find((p) => p.code === provinceCode);
        if (province && province.districts && province.districts.length > 0) {
          console.log("Using districts from loaded province:", province.name, province.districts.length);
          setDistricts(province.districts);
        } else {
          // Always fetch districts from API to ensure we have them
          console.log("Fetching districts from API for province code:", provinceCode);
          const fetchedDistricts = await getDistricts(provinceCode);
          console.log("Fetched districts:", fetchedDistricts.length);
          if (fetchedDistricts.length > 0) {
            setDistricts(fetchedDistricts);
          } else {
            console.warn("No districts found for province code:", provinceCode);
            setDistricts([]);
            toast.error("Tỉnh/thành phố này không có quận/huyện nào.");
          }
        }
      } catch (error) {
        console.error("Failed to load districts:", error);
        toast.error("Không thể tải danh sách quận/huyện. Vui lòng thử lại.");
        setDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };

    loadDistrictsForProvince();
  }, [selectedCity, selectedProvinceCode, provinces, setValue]);

  // Load wards when district is selected
  useEffect(() => {
    const loadWardsForDistrict = async () => {
      if (!selectedDistrict || !selectedDistrictCode) {
        setWards([]);
        setValue("ward", "");
        return;
      }

      try {
        setIsLoadingWards(true);
        setValue("ward", "");

        // Try to get wards from already loaded district first
        const district = districts.find((d) => d.code === selectedDistrictCode);
        if (district && district.wards && district.wards.length > 0) {
          console.log("Using wards from loaded district:", district.name, district.wards.length);
          setWards(district.wards);
        } else {
          // Always fetch wards from API to ensure we have the latest data
          console.log("Fetching wards from API for district code:", selectedDistrictCode);
          const fetchedWards = await getWards(selectedDistrictCode);
          console.log("Fetched wards:", fetchedWards.length);
          if (fetchedWards.length > 0) {
            setWards(fetchedWards);
          } else {
            console.warn("No wards found for district code:", selectedDistrictCode);
            setWards([]);
            toast.error("Quận/huyện này không có phường/xã nào.");
          }
        }
      } catch (error) {
        console.error("Failed to load wards:", error);
        toast.error("Không thể tải danh sách phường/xã. Vui lòng thử lại.");
        setWards([]);
      } finally {
        setIsLoadingWards(false);
      }
    };

    loadWardsForDistrict();
  }, [selectedDistrict, selectedDistrictCode, districts, setValue]);

  // Auto-fill user information when user data is available
  // Only fill if the fields are empty to avoid overwriting user input
  useEffect(() => {
    if (user && isAuthenticated) {
      const currentFullName = getValues("fullName");
      const currentPhoneNumber = getValues("phoneNumber");
      
      if (user.fullName && !currentFullName) {
        setValue("fullName", user.fullName);
      }
      if (user.phoneNumber && !currentPhoneNumber) {
        setValue("phoneNumber", user.phoneNumber);
      }
    }
  }, [user, isAuthenticated, setValue, getValues]);

  const onSubmit = async (data: CheckoutFormData) => {
    try {
      // Validate email for guests
      if (!isAuthenticated) {
        if (!data.email || data.email.trim() === "") {
          toast.error("Vui lòng nhập email để tiếp tục đặt hàng.");
          setValue("email", "", { shouldValidate: true });
          return;
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email.trim())) {
          toast.error("Email không hợp lệ. Vui lòng kiểm tra lại.");
          setValue("email", data.email, { shouldValidate: true });
          return;
        }
      }

      let orderResponse: any;
      let orderId: string;
      let paymentData: any;

      if (isAuthenticated) {
        // Create order for authenticated user
        orderResponse = await createOrder.mutateAsync({
          shippingAddress: {
            fullName: data.fullName,
            phoneNumber: data.phoneNumber,
            addressLine: data.addressLine,
            ward: data.ward,
            district: data.district,
            city: data.city,
          },
          paymentMethod: data.paymentMethod,
          voucherCode: appliedVoucherCode || undefined,
        });

        // Log response for debugging
        console.log("Create order response:", orderResponse);

        // Handle different response structures from backend
        const orderData = (orderResponse as any)?.order || orderResponse;
        paymentData = (orderResponse as any)?.payment;
        orderId = orderData?.id;

        if (!orderId) {
          console.error("Order ID is undefined. Response:", orderResponse);
          toast.error("Không thể lấy thông tin đơn hàng. Vui lòng thử lại.");
          return;
        }

        // If payment method is COD, show success message and redirect
        if (data.paymentMethod === PaymentMethod.COD) {
          const userEmail = userMe?.email || user?.email || "";
          toast.success("Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.", {
            description: userEmail ? `Email xác nhận đã được gửi đến ${userEmail}. Vui lòng kiểm tra hộp thư đến và spam folder.` : "Email xác nhận đã được gửi. Vui lòng kiểm tra hộp thư đến và spam folder.",
            duration: 5000,
          });
          router.push(`/account/orders/${orderId}`);
          return;
        }

        // If backend already returned payment info (PayOS case)
        if (paymentData?.success && paymentData?.paymentUrl) {
          sessionStorage.setItem("payos_orderId", orderId);
          toast.success("Đặt hàng thành công! Đang chuyển đến trang thanh toán...");
          window.location.href = paymentData.paymentUrl;
          return;
        }

        // If payment method is not COD and no payment data, create payment
        const paymentResponse = await createPayment.mutateAsync(orderId);
        console.log("Create payment response:", paymentResponse);
        
        // Check if it's COD from response
        if (paymentResponse.isCod) {
          toast.success("Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.");
          router.push(`/account/orders/${orderId}`);
          return;
        }
        
        // Check if it's PayOS (Bank Transfer)
        if (paymentResponse.success && paymentResponse.paymentUrl) {
          sessionStorage.setItem("payos_orderId", orderId);
          toast.success("Đặt hàng thành công! Đang chuyển đến trang thanh toán...");
          window.location.href = paymentResponse.paymentUrl;
          return;
        }
        
        // For MoMo, VNPay - redirect to payment URL
        if (paymentResponse.paymentUrl) {
          window.location.href = paymentResponse.paymentUrl;
          return;
        }

        toast.success("Đặt hàng thành công!");
        router.push(`/account/orders/${orderId}`);
      } else {
        // Create guest order - need to include cart items since guest cart is client-side
        const guestCartItems = cart?.items?.map(item => ({
          productId: item.productId,
          productVariantId: item.productVariantId || null,
          quantity: item.quantity,
        })) || [];

        if (guestCartItems.length === 0) {
          toast.error("Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.");
          return;
        }

        orderResponse = await createGuestOrder.mutateAsync({
          email: data.email!,
          fullName: data.fullName,
          shippingAddress: {
            fullName: data.fullName,
            phoneNumber: data.phoneNumber,
            addressLine: data.addressLine,
            ward: data.ward,
            district: data.district,
            city: data.city,
          },
          paymentMethod: Number(data.paymentMethod), // 0=COD, 1=MoMo, 2=VNPay, 3=PayOS
          items: guestCartItems,
          voucherCode: appliedVoucherCode || undefined,
        });

        console.log("Create guest order response:", orderResponse);

        const orderData = (orderResponse as any)?.order || orderResponse;
        paymentData = (orderResponse as any)?.payment;
        orderId = orderData?.id;

        if (!orderId) {
          console.error("Order ID is undefined. Response:", orderResponse);
          toast.error("Không thể lấy thông tin đơn hàng. Vui lòng thử lại.");
          return;
        }

        // If payment method is COD, show success message and redirect to guest success page
        if (data.paymentMethod === PaymentMethod.COD) {
          toast.success("Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.");
          // Redirect to guest order success page
          router.push(`/checkout/success?orderId=${orderId}&orderNumber=${orderData?.orderNumber || ""}&email=${encodeURIComponent(data.email!)}`);
          return;
        }

        // If backend already returned payment info (PayOS case)
        if (paymentData?.success && paymentData?.paymentUrl) {
          sessionStorage.setItem("payos_orderId", orderId);
          sessionStorage.setItem("guest_orderId", orderId);
          toast.success("Đặt hàng thành công! Đang chuyển đến trang thanh toán...");
          window.location.href = paymentData.paymentUrl;
          return;
        }

        // If payment method is not COD and no payment data, create guest payment
        const paymentResponse = await createGuestPayment.mutateAsync(orderId);
        console.log("Create guest payment response:", paymentResponse);
        
        // Check if it's COD from response
        if (paymentResponse.isCod) {
          toast.success("Đặt hàng thành công! Bạn sẽ thanh toán khi nhận hàng.");
          router.push(`/checkout/success?orderId=${orderId}&orderNumber=${orderData?.orderNumber || ""}&email=${encodeURIComponent(data.email!)}`);
          return;
        }
        
        // Check if it's PayOS (Bank Transfer)
        if (paymentResponse.success && paymentResponse.paymentUrl) {
          sessionStorage.setItem("payos_orderId", orderId);
          sessionStorage.setItem("guest_orderId", orderId);
          toast.success("Đặt hàng thành công! Đang chuyển đến trang thanh toán...");
          window.location.href = paymentResponse.paymentUrl;
          return;
        }
        
        // For MoMo, VNPay - redirect to payment URL
        if (paymentResponse.paymentUrl) {
          sessionStorage.setItem("guest_orderId", orderId);
          window.location.href = paymentResponse.paymentUrl;
          return;
        }

        toast.success("Đặt hàng thành công!");
        router.push(`/checkout/success?orderId=${orderId}&orderNumber=${orderData?.orderNumber || ""}&email=${encodeURIComponent(data.email!)}`);
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error?.data?.message || error?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
    }
  };

  // Show loading state while cart is loading
  if (isCartLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <Loader2 className="h-16 w-16 mx-auto mb-4 text-emerald-500 animate-spin" />
          <h2 className="text-2xl font-bold mb-2 text-emerald-900">Đang tải giỏ hàng...</h2>
          <p className="text-muted-foreground">
            Vui lòng đợi trong giây lát
          </p>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-emerald-500/50" />
          <h2 className="text-2xl font-bold mb-2 text-emerald-900">Giỏ hàng trống</h2>
          <p className="text-muted-foreground mb-6">
            Bạn chưa có sản phẩm nào trong giỏ hàng
          </p>
          <Button onClick={() => router.push("/products")} size="lg">
            Tiếp tục mua sắm
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-600 to-emerald-800 bg-clip-text text-transparent">
          Thanh toán
        </h1>
        <p className="text-muted-foreground">
          Vui lòng điền thông tin giao hàng và chọn phương thức thanh toán
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Information */}
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <MapPin className="h-5 w-5" />
                Thông tin giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="flex items-center gap-2 text-emerald-900">
                      <User className="h-4 w-4" />
                      Họ và tên
                    </Label>
                    <Input 
                      id="fullName" 
                      {...register("fullName")} 
                      placeholder="Nguyễn Văn A"
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                    {errors.fullName && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-emerald-900">
                      <Phone className="h-4 w-4" />
                      Số điện thoại
                    </Label>
                    <Input 
                      id="phoneNumber" 
                      {...register("phoneNumber")} 
                      placeholder="0901234567"
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                    {errors.phoneNumber && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        {errors.phoneNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email field - only show for guests */}
                {!isAuthenticated && (
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2 text-emerald-900">
                      <Mail className="h-4 w-4" />
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="email" 
                      type="email"
                      {...register("email", { 
                        required: !isAuthenticated ? "Vui lòng nhập email" : false,
                        validate: (value) => {
                          if (!isAuthenticated && (!value || value.trim() === "")) {
                            return "Email là bắt buộc cho khách hàng";
                          }
                          if (value && value.trim() !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                            return "Email không hợp lệ";
                          }
                          return true;
                        }
                      })} 
                      placeholder="example@email.com"
                      className="border-emerald-200 focus:border-emerald-500"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="addressLine" className="flex items-center gap-2 text-emerald-900">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ
                  </Label>
                  <Input 
                    id="addressLine" 
                    {...register("addressLine")} 
                    placeholder="Số nhà, tên đường"
                    className="border-emerald-200 focus:border-emerald-500"
                  />
                  {errors.addressLine && (
                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                      {errors.addressLine.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-emerald-900">Tỉnh/Thành phố</Label>
                    <Select
                      id="city"
                      value={
                        selectedCity
                          ? provinces.find((p) => p.name === selectedCity)
                            ? `${provinces.find((p) => p.name === selectedCity)?.code}|${selectedCity}`
                            : ""
                          : ""
                      }
                      onValueChange={(value) => {
                        if (!value) {
                          setValue("city", "");
                          setValue("district", "");
                          setValue("ward", "");
                          setDistricts([]);
                          setWards([]);
                          setSelectedProvinceCode(null);
                          return;
                        }
                        const parts = value.split("|");
                        const provinceCode = parseInt(parts[0]);
                        const provinceName = parts[1] || value;
                        console.log("Selected province:", provinceName, "Code:", provinceCode);
                        setSelectedProvinceCode(provinceCode);
                        setValue("city", provinceName);
                        setValue("district", "");
                        setValue("ward", "");
                        // Districts will be loaded in useEffect
                      }}
                      disabled={isLoadingProvinces}
                      className="border-emerald-200 focus:border-emerald-500"
                    >
                      <SelectItem value="">Chọn tỉnh/thành phố</SelectItem>
                      {provinces.map((province) => (
                        <SelectItem key={province.code} value={`${province.code}|${province.name}`}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.city && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.city.message}
                      </p>
                    )}
                    {isLoadingProvinces && (
                      <p className="text-xs text-muted-foreground">Đang tải...</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district" className="text-emerald-900">Quận/Huyện</Label>
                    <Select
                      id="district"
                      value={
                        selectedDistrict
                          ? districts.find((d) => d.name === selectedDistrict)
                            ? `${districts.find((d) => d.name === selectedDistrict)?.code}|${selectedDistrict}`
                            : ""
                          : ""
                      }
                      onValueChange={(value) => {
                        if (!value) {
                          setValue("district", "");
                          setValue("ward", "");
                          setSelectedDistrictCode(null);
                          setWards([]);
                          return;
                        }
                        const parts = value.split("|");
                        const districtCode = parseInt(parts[0]);
                        const districtName = parts[1] || value;
                        console.log("Selected district:", districtName, "Code:", districtCode);
                        setSelectedDistrictCode(districtCode);
                        setValue("district", districtName);
                        setValue("ward", "");
                      }}
                      disabled={!selectedCity || isLoadingDistricts || districts.length === 0}
                      className="border-emerald-200 focus:border-emerald-500"
                    >
                      <SelectItem value="">Chọn quận/huyện</SelectItem>
                      {districts.map((district) => (
                        <SelectItem key={district.code} value={`${district.code}|${district.name}`}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.district && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.district.message}
                      </p>
                    )}
                    {isLoadingDistricts && (
                      <p className="text-xs text-muted-foreground">Đang tải...</p>
                    )}
                    {!selectedCity && (
                      <p className="text-xs text-muted-foreground">Vui lòng chọn tỉnh/thành phố trước</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ward" className="text-emerald-900">Phường/Xã</Label>
                    <Select
                      id="ward"
                      value={selectedWard || ""}
                      onValueChange={(value) => {
                        setValue("ward", value);
                      }}
                      disabled={!selectedDistrict || isLoadingWards || wards.length === 0}
                      className="border-emerald-200 focus:border-emerald-500"
                    >
                      <SelectItem value="">Chọn phường/xã</SelectItem>
                      {wards.map((ward) => (
                        <SelectItem key={ward.code} value={ward.name}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </Select>
                    {errors.ward && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.ward.message}
                      </p>
                    )}
                    {isLoadingWards && (
                      <p className="text-xs text-muted-foreground">Đang tải...</p>
                    )}
                    {!selectedDistrict && (
                      <p className="text-xs text-muted-foreground">Vui lòng chọn quận/huyện trước</p>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div className="space-y-2 pt-2">
                  <Label htmlFor="paymentMethod" className="flex items-center gap-2 text-emerald-900">
                    <CreditCard className="h-4 w-4" />
                    Phương thức thanh toán
                  </Label>
                  <div className="grid grid-cols-1 gap-3">
                    {/* COD Option */}
                    <button
                      type="button"
                      onClick={() => setValue("paymentMethod", PaymentMethod.COD)}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === PaymentMethod.COD
                          ? "border-emerald-500 bg-emerald-50 shadow-md"
                          : "border-emerald-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        paymentMethod === PaymentMethod.COD
                          ? "bg-emerald-100"
                          : "bg-emerald-50"
                      }`}>
                        <CreditCard className={`h-6 w-6 ${
                          paymentMethod === PaymentMethod.COD
                            ? "text-emerald-600"
                            : "text-emerald-400"
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-emerald-900">Thanh toán khi nhận hàng</div>
                        <div className="text-xs text-muted-foreground">Cash on Delivery (COD)</div>
                      </div>
                      {paymentMethod === PaymentMethod.COD && (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      )}
                    </button>

                    {/* MoMo Option */}
                    <button
                      type="button"
                      onClick={() => setValue("paymentMethod", PaymentMethod.MoMo)}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === PaymentMethod.MoMo
                          ? "border-purple-500 bg-purple-50 shadow-md"
                          : "border-emerald-200 bg-white hover:border-purple-300 hover:bg-purple-50/50"
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-lg flex items-center justify-center overflow-hidden ${
                        paymentMethod === PaymentMethod.MoMo
                          ? "bg-white border-2 border-purple-200"
                          : "bg-purple-50"
                      }`}>
                        <Image
                          src={momoIcon}
                          alt="MoMo"
                          width={56}
                          height={56}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-purple-900">MoMo</div>
                        <div className="text-xs text-muted-foreground">Ví điện tử MoMo</div>
                      </div>
                      {paymentMethod === PaymentMethod.MoMo && (
                        <CheckCircle2 className="h-5 w-5 text-purple-600" />
                      )}
                    </button>

                    {/* VNPay Option */}
                    <button
                      type="button"
                      onClick={() => setValue("paymentMethod", PaymentMethod.VNPay)}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === PaymentMethod.VNPay
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-emerald-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                      }`}
                    >
                      <div className={`w-20 h-12 rounded-lg flex items-center justify-center overflow-hidden ${
                        paymentMethod === PaymentMethod.VNPay
                          ? "bg-white border-2 border-blue-200"
                          : "bg-blue-50"
                      }`}>
                        <Image
                          src={vnpayLogo}
                          alt="VNPay"
                          width={80}
                          height={30}
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-blue-900">VNPay</div>
                        <div className="text-xs text-muted-foreground">Cổng thanh toán VNPay</div>
                      </div>
                      {paymentMethod === PaymentMethod.VNPay && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      )}
                    </button>

                    {/* Bank Transfer Option */}
                    <button
                      type="button"
                      onClick={() => setValue("paymentMethod", PaymentMethod.BankTransfer)}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        paymentMethod === PaymentMethod.BankTransfer
                          ? "border-cyan-500 bg-cyan-50 shadow-md"
                          : "border-emerald-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        paymentMethod === PaymentMethod.BankTransfer
                          ? "bg-cyan-100"
                          : "bg-cyan-50"
                      }`}>
                        <Building2 className={`h-6 w-6 ${
                          paymentMethod === PaymentMethod.BankTransfer
                            ? "text-cyan-600"
                            : "text-cyan-400"
                        }`} />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold text-cyan-900">Thanh toán qua PayOS</div>
                        <div className="text-xs text-muted-foreground">Quét mã QR hoặc chuyển khoản ngân hàng</div>
                      </div>
                      {paymentMethod === PaymentMethod.BankTransfer && (
                        <CheckCircle2 className="h-5 w-5 text-cyan-600" />
                      )}
                    </button>
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.paymentMethod.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-500/30"
                  size="lg"
                  disabled={createOrder.isPending || createPayment.isPending || createGuestOrder.isPending || createGuestPayment.isPending}
                >
                  {createOrder.isPending || createPayment.isPending || createGuestOrder.isPending || createGuestPayment.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-5 w-5" />
                      Đặt hàng ngay
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="sticky top-4 border-emerald-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-b border-emerald-100">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <ShoppingBag className="h-5 w-5" />
                Tóm tắt đơn hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex gap-3 pb-4 border-b border-emerald-100 last:border-0">
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-emerald-50">
                      <Image
                        src={item.productImageUrl || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23e5e7eb'/%3E%3C/svg%3E"}
                        alt={item.productName || "Product"}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-emerald-900 line-clamp-2">
                        {item.productName || "Sản phẩm"}
                      </h4>
                      {/* Variant Info */}
                      {"variantInfo" in item && item.variantInfo && (
                        <p className="text-xs text-emerald-600 mt-1">
                          {item.variantInfo}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Số lượng: {item.quantity}
                      </p>
                      <p className="text-sm font-semibold text-emerald-600 mt-1">
                        {formatCurrency(item.lineTotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-3 pt-4 border-t border-emerald-200">
                {/* Voucher input */}
                <div className="space-y-2">
                  <Label htmlFor="voucherCode" className="text-sm text-emerald-900">
                    Mã giảm giá
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="voucherCode"
                      placeholder="Nhập mã giảm giá (ví dụ: HELLO)"
                      value={voucherCode}
                      onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                      className="flex-1"
                      disabled={isApplyingVoucher}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        if (!voucherCode.trim()) {
                          toast.error("Vui lòng nhập mã giảm giá");
                          return;
                        }
                        if (!cart || !cart.items || cart.items.length === 0) {
                          toast.error("Giỏ hàng trống, không thể áp dụng mã giảm giá");
                          return;
                        }
                        try {
                          setIsApplyingVoucher(true);
                          let response;
                          if (isAuthenticated) {
                            response = await applyVoucherUser.mutateAsync({ code: voucherCode.trim() });
                          } else {
                            const guestItems = cart.items.map((item) => ({
                              productId: item.productId,
                              productVariantId: item.productVariantId || null,
                              quantity: item.quantity,
                            }));
                            const emailValue = getValues("email");
                            if (!emailValue || !emailValue.trim()) {
                              toast.error("Vui lòng nhập email trước khi áp dụng mã giảm giá");
                              return;
                            }
                            response = await applyVoucherGuest.mutateAsync({
                              email: emailValue.trim(),
                              items: guestItems,
                              code: voucherCode.trim(),
                            });
                          }
                          setAppliedVoucherCode(voucherCode.trim());
                          setDiscountAmount(response.discountAmount);
                          setFinalTotal(response.finalTotal);
                          toast.success("Áp dụng mã giảm giá thành công");
                        } catch (error: any) {
                          console.error("Apply voucher error:", error);
                          setAppliedVoucherCode(null);
                          setDiscountAmount(0);
                          setFinalTotal(null);
                          toast.error(
                            error?.data?.message || error?.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn."
                          );
                        } finally {
                          setIsApplyingVoucher(false);
                        }
                      }}
                      disabled={isApplyingVoucher}
                    >
                      {isApplyingVoucher ? "Đang áp dụng..." : "Áp dụng"}
                    </Button>
                  </div>
                  {appliedVoucherCode && (
                    <div className="flex items-center justify-between text-xs text-emerald-700">
                      <span>
                        Đã áp dụng mã <span className="font-semibold">{appliedVoucherCode}</span>
                      </span>
                      <button
                        type="button"
                        className="text-red-500 underline"
                        onClick={() => {
                          setAppliedVoucherCode(null);
                          setDiscountAmount(0);
                          setFinalTotal(null);
                        }}
                      >
                        Xóa mã
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Tạm tính ({cart.totalItems} sản phẩm)</span>
                  <span>{formatCurrency(cart.subTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Phí vận chuyển</span>
                  <span className="text-emerald-600 font-medium">Miễn phí</span>
                </div>
                {appliedVoucherCode && discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-700">
                    <span>Giảm giá ({appliedVoucherCode})</span>
                    <span>-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="border-t border-emerald-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-emerald-900">Tổng cộng</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
                      {formatCurrency(finalTotal ?? cart.subTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

