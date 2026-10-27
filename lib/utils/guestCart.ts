"use client";

import type { AddCartItemRequest } from "@/lib/api/types";
import { DEBUG_API } from "@/lib/utils/debugApi";

const GUEST_CART_KEY = "guestCart";

export interface GuestCartItem extends AddCartItemRequest {
  addedAt: number;
  productName?: string;
  productImageUrl?: string;
  unitPrice?: number;
  variantInfo?: string | null; // Variant display info: "Màu: Đỏ, Thông số: 13mm"
}

export type GuestCartItemInput = Omit<GuestCartItem, "addedAt">;

const MAX_QTY = 999;
const MAX_ITEMS = 100;

const str = (v: unknown, max: number): string | undefined =>
  typeof v === "string" ? v.slice(0, max) : undefined;

/**
 * localStorage do người dùng (hoặc script chạy trên cùng origin) có thể sửa: không tin dữ liệu đọc ra.
 * Chuẩn hóa từng dòng: id phải là chuỗi, số lượng là số nguyên 1..999, chuỗi hiển thị bị giới hạn độ dài.
 * LƯU Ý: giá (`unitPrice`) trong giỏ chỉ để HIỂN THỊ; backend phải luôn tự tính giá từ DB khi tạo đơn.
 */
export function sanitizeGuestCart(raw: unknown): GuestCartItem[] {
  if (!Array.isArray(raw)) return [];
  const items: GuestCartItem[] = [];
  for (const entry of raw.slice(0, MAX_ITEMS)) {
    if (!entry || typeof entry !== "object") continue;
    const e = entry as Record<string, unknown>;
    const productId = str(e.productId, 64);
    if (!productId || !/^[A-Za-z0-9-]+$/.test(productId)) continue;
    const variantId = str(e.productVariantId, 64);
    const qty = Number(e.quantity);
    if (!Number.isInteger(qty) || qty < 1) continue;
    const unitPrice = Number(e.unitPrice);
    items.push({
      productId,
      productVariantId: variantId && /^[A-Za-z0-9-]+$/.test(variantId) ? variantId : null,
      quantity: Math.min(qty, MAX_QTY),
      addedAt: Number.isFinite(Number(e.addedAt)) ? Number(e.addedAt) : Date.now(),
      productName: str(e.productName, 300),
      productImageUrl: str(e.productImageUrl, 1000),
      unitPrice: Number.isFinite(unitPrice) && unitPrice >= 0 ? unitPrice : undefined,
      variantInfo: str(e.variantInfo, 300) ?? null,
    });
  }
  return items;
}

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? sanitizeGuestCart(JSON.parse(cart)) : [];
  } catch {
    return [];
  }
}

export function addToGuestCart(item: GuestCartItemInput): void {
  if (typeof window === "undefined") return;
  try {
    const cart = getGuestCart();
    const existingItemIndex = cart.findIndex(
      (i) =>
        i.productId === item.productId &&
        (i.productVariantId ?? null) === (item.productVariantId ?? null)
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item already exists
      cart[existingItemIndex].quantity = Math.min(
        cart[existingItemIndex].quantity + item.quantity,
        MAX_QTY
      );
    } else {
      // Add new item
      cart.push({
        ...item,
        addedAt: Date.now(),
      });
    }

    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    if (DEBUG_API) {
      console.warn("Failed to save guest cart:", error);
    }
  }
}

export function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    if (DEBUG_API) {
      console.warn("Failed to clear guest cart:", error);
    }
  }
}

export function getGuestCartItemCount(): number {
  const cart = getGuestCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}

