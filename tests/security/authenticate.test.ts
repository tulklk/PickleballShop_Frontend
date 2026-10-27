import { describe, expect, it, vi } from "vitest";
import { authenticateRequest } from "@/lib/server/authenticate";
import { isAdminUser } from "@/lib/auth/roles";

const req = (authorization?: string) =>
  new Request("http://localhost/api/upload", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });

const okFetch = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("authenticateRequest (server-side, backend là nguồn sự thật)", () => {
  it("null khi thiếu header / sai scheme / token chứa ký tự lạ", async () => {
    const f = okFetch({ id: "1" });
    expect(await authenticateRequest(req(), f)).toBeNull();
    expect(await authenticateRequest(req("Basic abc"), f)).toBeNull();
    expect(await authenticateRequest(req("Bearer a b"), f)).toBeNull();
    expect(await authenticateRequest(req("Bearer a;b<script>"), f)).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("null khi backend từ chối token (401) hoặc lỗi mạng", async () => {
    expect(await authenticateRequest(req("Bearer abc.def.ghi"), okFetch({}, 401))).toBeNull();
    const boom = vi.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    expect(await authenticateRequest(req("Bearer abc.def.ghi"), boom)).toBeNull();
  });

  it("role lấy từ backend, không từ client", async () => {
    const user = await authenticateRequest(
      req("Bearer abc.def.ghi"),
      okFetch({ id: "u1", role: "Customer" })
    );
    expect(user).toEqual({ id: "u1", role: "Customer", isAdmin: false });

    const admin = await authenticateRequest(
      req("Bearer abc.def.ghi"),
      okFetch({ user: { id: "a1", role: "Admin" } })
    );
    expect(admin?.isAdmin).toBe(true);
  });

  it("chỉ gọi backend theo cấu hình (token không đổi URL đích)", async () => {
    const f = okFetch({ id: "u1", role: "Customer" });
    await authenticateRequest(req("Bearer abc.def.ghi"), f);
    const [url, init] = (f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0];
    expect(url).toMatch(/\/api\/Auth\/me$/);
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer abc.def.ghi");
  });
});

describe("isAdminUser", () => {
  it("chỉ role Admin được coi là admin", () => {
    expect(isAdminUser({ role: "Admin" })).toBe(true);
    expect(isAdminUser({ role: "Customer" })).toBe(false);
    expect(isAdminUser({ role: null })).toBe(false);
    expect(isAdminUser(null)).toBe(false);
  });
});
