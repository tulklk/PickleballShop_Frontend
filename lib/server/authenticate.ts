import { isAdminUser } from "@/lib/auth/roles";

export type AuthenticatedUser = {
  id: string;
  role: string | number | null;
  isAdmin: boolean;
};

/** Base URL backend, chỉ lấy từ biến môi trường (không bao giờ từ input của client). */
export function getBackendBaseUrl(): string {
  const url =
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://pickleballshop-backend.fly.dev";
  return url.replace(/\/$/, "");
}

/**
 * Xác thực request bằng cách hỏi backend (nguồn sự thật về token/role) qua `/api/Auth/me`.
 * Không decode JWT ở đây và không tin bất kỳ role nào do client gửi.
 * Trả về null nếu thiếu token, token sai/hết hạn hoặc backend không phản hồi.
 */
export async function authenticateRequest(
  request: Request,
  fetchImpl: typeof fetch = fetch
): Promise<AuthenticatedUser | null> {
  const header = request.headers.get("authorization") || "";
  const match = /^Bearer\s+([A-Za-z0-9\-._~+/]+=*)$/.exec(header.trim());
  if (!match || match[1].length > 4096) return null;

  try {
    const res = await fetchImpl(`${getBackendBaseUrl()}/api/Auth/me`, {
      method: "GET",
      headers: { Authorization: `Bearer ${match[1]}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      id?: unknown;
      role?: string | number | null;
      user?: { id?: unknown; role?: string | number | null };
    };
    const u = data?.user ?? data;
    const id = typeof u?.id === "string" ? u.id : null;
    if (!id) return null;
    const role = (u?.role ?? null) as string | number | null;
    return { id, role, isAdmin: isAdminUser({ role }) };
  } catch {
    return null;
  }
}
