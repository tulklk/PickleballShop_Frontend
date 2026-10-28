import type { CreateGuestOrderRequest, GuestOrderItem } from "@/lib/api/types";

/** Giới hạn khớp backend. */
export const MAX_ORDER_LINES = 50;
export const MIN_ITEM_QUANTITY = 1;
export const MAX_ITEM_QUANTITY = 100;

const PHONE_RE = /^[0-9+\-() ]{8,20}$/;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const VALID_PAYMENT_METHODS = [0, 1, 2, 3];

export function clampQuantity(value: unknown): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return MIN_ITEM_QUANTITY;
  return Math.min(MAX_ITEM_QUANTITY, Math.max(MIN_ITEM_QUANTITY, n));
}

export function isValidPhone(value: string | null | undefined): boolean {
  return !!value && PHONE_RE.test(value.trim());
}

export function isValidEmail(value: string | null | undefined): boolean {
  return !!value && value.length <= 254 && EMAIL_RE.test(value.trim());
}

/**
 * Chỉ giữ {productId, productVariantId?, quantity}. Mọi trường khác (giá, tên, tổng tiền...) bị bỏ —
 * backend tự tính giá từ DB; client không bao giờ là nguồn sự thật về tiền.
 */
export function sanitizeOrderItems(
  items: ReadonlyArray<{ productId: string; productVariantId?: string | null; quantity: number }>
): GuestOrderItem[] {
  if (items.length > MAX_ORDER_LINES) {
    throw new Error(`Đơn hàng tối đa ${MAX_ORDER_LINES} dòng sản phẩm.`);
  }
  return items.map((i) => {
    const out: GuestOrderItem = {
      productId: String(i.productId),
      quantity: clampQuantity(i.quantity),
    };
    if (i.productVariantId) out.productVariantId = String(i.productVariantId);
    return out;
  });
}

/** Trả về thông báo lỗi (tiếng Việt) nếu dữ liệu đặt hàng guest không hợp lệ, ngược lại null. */
export function validateGuestOrder(data: CreateGuestOrderRequest): string | null {
  if (!isValidEmail(data.email)) return "Email không hợp lệ.";
  if (!data.items?.length) return "Giỏ hàng trống.";
  if (data.items.length > MAX_ORDER_LINES) return `Đơn hàng tối đa ${MAX_ORDER_LINES} dòng sản phẩm.`;
  if (data.items.some((i) => !Number.isInteger(i.quantity) || i.quantity < MIN_ITEM_QUANTITY || i.quantity > MAX_ITEM_QUANTITY)) {
    return `Số lượng mỗi sản phẩm phải từ ${MIN_ITEM_QUANTITY} đến ${MAX_ITEM_QUANTITY}.`;
  }
  if (!isValidPhone(data.shippingAddress?.phoneNumber)) {
    return "Số điện thoại không hợp lệ (8–20 ký tự gồm số, + - ( ) và khoảng trắng).";
  }
  if (!VALID_PAYMENT_METHODS.includes(data.paymentMethod)) return "Phương thức thanh toán không hợp lệ.";
  return null;
}

/** Payload đặt hàng guest chỉ gồm các trường được phép, không có giá/tổng tiền. */
export function sanitizeGuestOrderPayload(data: CreateGuestOrderRequest): CreateGuestOrderRequest {
  const payload: CreateGuestOrderRequest = {
    email: data.email.trim(),
    fullName: data.fullName,
    shippingAddress: {
      fullName: data.shippingAddress.fullName,
      phoneNumber: data.shippingAddress.phoneNumber.trim(),
      addressLine: data.shippingAddress.addressLine,
      ward: data.shippingAddress.ward,
      district: data.shippingAddress.district,
      city: data.shippingAddress.city,
    },
    paymentMethod: data.paymentMethod,
    items: sanitizeOrderItems(data.items),
  };
  if (data.voucherCode) payload.voucherCode = data.voucherCode;
  return payload;
}
