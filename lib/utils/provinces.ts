import { DEBUG_API } from "@/lib/utils/debugApi";

// Types for Vietnamese administrative divisions API
export interface Ward {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  short_codename: string;
}

export interface District {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  province_code: number;
  wards?: Ward[] | null;
}

export interface Province {
  name: string;
  code: number;
  codename: string;
  division_type: string;
  phone_code: number;
  districts?: District[] | null;
}

const PROVINCES_API_BASE = "https://provinces.open-api.vn/api/v1";

/**
 * Fetch all provinces with their districts
 */
export async function getProvinces(): Promise<Province[]> {
  try {
    const response = await fetch(`${PROVINCES_API_BASE}/?depth=2`);
    if (!response.ok) {
      throw new Error("Failed to fetch provinces");
    }
    const data: Province[] = await response.json();
    return data;
  } catch (error) {
    if (DEBUG_API) {
      console.error("Error fetching provinces:", error);
    }
    throw error;
  }
}

/**
 * Fetch districts for a specific province
 */
export async function getDistricts(provinceCode: number): Promise<District[]> {
  try {
    const response = await fetch(`${PROVINCES_API_BASE}/p/${provinceCode}?depth=2`);
    if (!response.ok) {
      throw new Error("Failed to fetch districts");
    }
    const data: Province = await response.json();
    return data.districts || [];
  } catch (error) {
    if (DEBUG_API) {
      console.error("Error fetching districts:", error);
    }
    throw error;
  }
}

/**
 * Fetch wards for a specific district
 */
export async function getWards(districtCode: number): Promise<Ward[]> {
  try {
    const response = await fetch(`${PROVINCES_API_BASE}/d/${districtCode}?depth=2`);
    if (!response.ok) {
      throw new Error("Failed to fetch wards");
    }
    const data: District = await response.json();
    return data.wards || [];
  } catch (error) {
    if (DEBUG_API) {
      console.error("Error fetching wards:", error);
    }
    throw error;
  }
}

/**
 * Find province by code
 */
export function findProvince(provinces: Province[], code: number): Province | undefined {
  return provinces.find((p) => p.code === code);
}

/**
 * Find district by code in a province
 */
export function findDistrict(province: Province, code: number): District | undefined {
  return province.districts?.find((d) => d.code === code);
}

/**
 * Find ward by code in a district
 */
export function findWard(district: District, code: number): Ward | undefined {
  return district.wards?.find((w) => w.code === code);
}

