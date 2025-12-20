export interface SavedAddress {
  id: string;
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  ward: string;
  district: string;
  city: string;
  isDefault: boolean;
}

const STORAGE_KEY_PREFIX = "ika_user_addresses_";

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

export function getUserAddresses(userId: string | undefined | null): SavedAddress[] {
  if (typeof window === "undefined" || !userId) return [];
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedAddress[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveUserAddresses(userId: string, addresses: SavedAddress[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(userId), JSON.stringify(addresses));
}

export function upsertUserAddress(userId: string, address: Omit<SavedAddress, "id"> & { id?: string }): SavedAddress[] {
  const current = getUserAddresses(userId);
  let id = address.id || (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? (crypto as any).randomUUID()
    : `${Date.now()}_${Math.random().toString(36).slice(2)}`);

  const normalized: SavedAddress = {
    id,
    fullName: address.fullName.trim(),
    phoneNumber: address.phoneNumber.trim(),
    addressLine: address.addressLine.trim(),
    ward: address.ward.trim(),
    district: address.district.trim(),
    city: address.city.trim(),
    isDefault: !!address.isDefault,
  };

  let updated: SavedAddress[];
  const index = current.findIndex((a) => a.id === id);
  if (index >= 0) {
    updated = [...current];
    updated[index] = { ...current[index], ...normalized };
  } else {
    updated = [...current, normalized];
  }

  // If this address is default, unset default on others
  if (normalized.isDefault) {
    updated = updated.map((a) => ({ ...a, isDefault: a.id === normalized.id }));
  } else if (updated.length === 1) {
    // Nếu chỉ có 1 địa chỉ thì luôn coi là default
    updated[0].isDefault = true;
  }

  saveUserAddresses(userId, updated);
  return updated;
}

export function deleteUserAddress(userId: string, addressId: string): SavedAddress[] {
  const current = getUserAddresses(userId);
  let updated = current.filter((a) => a.id !== addressId);

  // Đảm bảo vẫn có 1 default nếu còn địa chỉ
  if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
    updated[0] = { ...updated[0], isDefault: true };
  }

  saveUserAddresses(userId, updated);
  return updated;
}

export function setDefaultUserAddress(userId: string, addressId: string): SavedAddress[] {
  const current = getUserAddresses(userId);
  const updated = current.map((a) => ({ ...a, isDefault: a.id === addressId }));
  saveUserAddresses(userId, updated);
  return updated;
}

export function getDefaultUserAddress(userId: string | undefined | null): SavedAddress | null {
  const addresses = getUserAddresses(userId || undefined);
  return addresses.find((a) => a.isDefault) || addresses[0] || null;
}
