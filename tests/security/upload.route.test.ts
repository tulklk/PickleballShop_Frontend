import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  user: null as null | { id: string; role: string; isAdmin: boolean },
  uploadShouldFail: false,
  uploadCalls: [] as Array<Record<string, unknown>>,
}));

vi.mock("@/lib/server/authenticate", () => ({
  authenticateRequest: vi.fn(async () => h.user),
}));

vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: (
        opts: Record<string, unknown>,
        cb: (err: unknown, res?: unknown) => void
      ) => {
        h.uploadCalls.push(opts);
        return {
          end: () => {
            if (h.uploadShouldFail) cb(new Error("boom api_secret=SUPERSECRET"));
            else
              cb(null, {
                secure_url: "https://res.cloudinary.com/demo/image/upload/x.png",
                public_id: "x",
              });
          },
        };
      },
    },
  },
}));

import { POST } from "@/app/api/upload/route";
import { __resetRateLimitForTests } from "@/lib/security/rateLimit";

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0, 0, 0, 0, 0]);

let ipCounter = 0;
function makeRequest(opts: {
  bytes?: Uint8Array;
  type?: string;
  name?: string;
  folder?: string | null;
  auth?: boolean;
}) {
  const fd = new FormData();
  const file = new File([(opts.bytes ?? PNG) as BlobPart], opts.name ?? "a.png", {
    type: opts.type ?? "image/png",
  });
  fd.set("file", file);
  if (opts.folder !== null) fd.set("folder", opts.folder ?? "pickleball-shop/products");
  const headers: Record<string, string> = { "x-forwarded-for": `10.0.0.${++ipCounter}` };
  if (opts.auth) headers.authorization = "Bearer abc.def.ghi";
  return new NextRequest("http://localhost/api/upload", { method: "POST", body: fd, headers });
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "key";
  process.env.CLOUDINARY_API_SECRET = "SUPERSECRET";
  h.user = null;
  h.uploadShouldFail = false;
  h.uploadCalls.length = 0;
  __resetRateLimitForTests();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("POST /api/upload — authentication & authorization", () => {
  it("401 khi chưa đăng nhập (thư mục admin)", async () => {
    const res = await POST(makeRequest({ folder: "pickleball-shop/products" }));
    expect(res.status).toBe(401);
    expect(h.uploadCalls).toHaveLength(0);
  });

  it("403 khi user thường upload vào thư mục admin (privilege escalation)", async () => {
    h.user = { id: "u1", role: "Customer", isAdmin: false };
    const res = await POST(makeRequest({ auth: true, folder: "pickleball-shop/news" }));
    expect(res.status).toBe(403);
    expect(h.uploadCalls).toHaveLength(0);
  });

  it("200 khi admin upload ảnh hợp lệ", async () => {
    h.user = { id: "a1", role: "Admin", isAdmin: true };
    const res = await POST(makeRequest({ auth: true }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toMatch(/^https:\/\/res\.cloudinary\.com\//);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("user thường được upload avatar, nhưng guest thì không", async () => {
    h.user = { id: "u1", role: "Customer", isAdmin: false };
    expect((await POST(makeRequest({ auth: true, folder: "pickleball-shop/avatars" }))).status).toBe(200);
    h.user = null;
    expect((await POST(makeRequest({ folder: "pickleball-shop/avatars" }))).status).toBe(401);
  });

  it("guest được upload ảnh review nhưng bị rate limit chặt", async () => {
    const sameIp = { "x-forwarded-for": "9.9.9.9" };
    const statuses: number[] = [];
    for (let i = 0; i < 7; i++) {
      const req = makeRequest({ folder: "pickleball-shop/reviews" });
      const fd = await req.formData();
      const r = new NextRequest("http://localhost/api/upload", {
        method: "POST",
        body: fd,
        headers: sameIp,
      });
      statuses.push((await POST(r)).status);
    }
    expect(statuses.slice(0, 5).every((s) => s === 200)).toBe(true);
    expect(statuses[5]).toBe(429);
  });
});

describe("POST /api/upload — input validation", () => {
  beforeEach(() => {
    h.user = { id: "a1", role: "Admin", isAdmin: true };
  });

  it.each([
    "../../etc",
    "pickleball-shop/../secret",
    "other-folder",
    "pickleball-shop/products/../../x",
    "__proto__",
    "constructor",
  ])("400 với folder ngoài allowlist: %s", async (folder) => {
    const res = await POST(makeRequest({ auth: true, folder }));
    expect(res.status).toBe(400);
    expect(h.uploadCalls).toHaveLength(0);
  });

  it("415 với SVG (XSS) dù khai báo Content-Type là image/png", async () => {
    const svg = new TextEncoder().encode(
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"></svg>'.padEnd(40, " ")
    );
    const res = await POST(makeRequest({ auth: true, bytes: svg, type: "image/png", name: "a.png" }));
    expect(res.status).toBe(415);
  });

  it("415 với file thực thi giả dạng ảnh", async () => {
    const exe = new Uint8Array([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0, 4, 0, 0, 0, 0xff, 0xff, 0, 0]);
    const res = await POST(makeRequest({ auth: true, bytes: exe, type: "image/jpeg", name: "shell.jpg" }));
    expect(res.status).toBe(415);
  });

  it("413 khi file > 5MB", async () => {
    const big = new Uint8Array(5 * 1024 * 1024 + 1);
    big.set(PNG);
    const res = await POST(makeRequest({ auth: true, bytes: big }));
    expect(res.status).toBe(413);
  });

  it("400 khi thiếu file", async () => {
    const fd = new FormData();
    fd.set("folder", "pickleball-shop/products");
    const req = new NextRequest("http://localhost/api/upload", {
      method: "POST",
      body: fd,
      headers: { authorization: "Bearer abc.def.ghi", "x-forwarded-for": "8.8.8.8" },
    });
    expect((await POST(req)).status).toBe(400);
  });

  it("không dùng tên file client và không cho ghi đè", async () => {
    await POST(makeRequest({ auth: true, name: "../../evil.png" }));
    expect(h.uploadCalls[0]).toMatchObject({
      use_filename: false,
      unique_filename: true,
      overwrite: false,
      resource_type: "image",
      folder: "pickleball-shop/products",
    });
  });

  it("lỗi upstream không làm lộ secret ra response", async () => {
    h.uploadShouldFail = true;
    const res = await POST(makeRequest({ auth: true }));
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toContain("SUPERSECRET");
    expect(text).not.toContain("boom");
  });

  it("503 khi chưa cấu hình Cloudinary (không lộ chi tiết)", async () => {
    delete process.env.CLOUDINARY_API_SECRET;
    const res = await POST(makeRequest({ auth: true }));
    expect(res.status).toBe(503);
  });
});
