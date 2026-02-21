"use client";

import type { AddCartItemRequest } from "@/lib/api/types";

const GUEST_CART_KEY = "guestCart";

export interface GuestCartItem extends AddCartItemRequest {
  addedAt: number;
  productName?: string;
  productImageUrl?: string;
  unitPrice?: number;
  variantInfo?: string | null; // Variant display info: "Màu: Đỏ, Thông số: 13mm"
}

export type GuestCartItemInput = Omit<GuestCartItem, "addedAt">;

export function getGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const cart = localStorage.getItem(GUEST_CART_KEY);
    return cart ? JSON.parse(cart) : [];
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
      cart[existingItemIndex].quantity += item.quantity;
    } else {
      // Add new item
      cart.push({
        ...item,
        addedAt: Date.now(),
      });
    }

    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn("Failed to save guest cart:", error);
  }
}

export function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (error) {
    console.warn("Failed to clear guest cart:", error);
  }
}

export function getGuestCartItemCount(): number {
  const cart = getGuestCart();
  return cart.reduce((total, item) => total + item.quantity, 0);
}

