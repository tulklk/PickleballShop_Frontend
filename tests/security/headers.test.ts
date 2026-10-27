import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { buildCsp } from "@/lib/security/csp";
import { middleware } from "@/middleware";
import {
  noStoreSources,
  securityHeaders,
} from "../../security-headers.mjs";

const API = "https://pickleballshop-backend.fly.dev";

function directive(csp: string, name: string): string[] {
  const d = csp.split(";").map((s) => s.trim()).find((s) => s.startsWith(name + " "));
  return d ? d.split(" ").slice(1) : [];
}

describe("CSP (production)", () => {
  const csp = buildCsp({ nonce: "NONCE123", isDev: false, apiBaseUrl: API });

  it("script-src dùng nonce + strict-dynamic, không unsafe-inline/unsafe-eval", () => {
    const s = directive(csp, "script-src");
    expect(s).toContain("'nonce-NONCE123'");
    expect(s).toContain("'strict-dynamic'");
    expect(s).not.toContain("'unsafe-inline'");
    expect(s).not.toContain("'unsafe-eval'");
  });

  it("chặn object/base/frame-ancestors/form-action ra ngoài", () => {
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("connect-src chỉ gồm self, Google, backend (https+wss)", () => {
    const c = directive(csp, "connect-src");
    expect(c).toContain(API);
    expect(c).toContain("wss://pickleballshop-backend.fly.dev");
    expect(c).not.toContain("*");
    expect(c.some((x) => x.startsWith("http://"))).toBe(false);
  });

  it("dev mới được unsafe-eval", () => {
    const dev = buildCsp({ nonce: "n", isDev: true, apiBaseUrl: API });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
  });
});

describe("middleware", () => {
  it("gắn CSP với nonce khác nhau cho mỗi request", () => {
    const a = middleware(new NextRequest("http://localhost/"));
    const b = middleware(new NextRequest("http://localhost/"));
    const ca = a.headers.get("content-security-policy") ?? "";
    const cb = b.headers.get("content-security-policy") ?? "";
    expect(ca).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(ca).not.toEqual(cb);
  });
});

describe("static security headers", () => {
  const map = new Map(securityHeaders.map((h) => [h.key, h.value]));
  it("có đủ header bắt buộc", () => {
    expect(map.get("X-Content-Type-Options")).toBe("nosniff");
    expect(map.get("X-Frame-Options")).toBe("DENY");
    expect(map.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(map.get("Strict-Transport-Security")).toMatch(/max-age=\d{7,}/);
    expect(map.get("Permissions-Policy")).toMatch(/camera=\(\)/);
  });
  it("trang cá nhân/admin/thanh toán/API là no-store", () => {
    for (const s of ["/account/:path*", "/admin/:path*", "/checkout/:path*", "/payments/:path*", "/api/:path*"]) {
      expect(noStoreSources).toContain(s);
    }
  });
});
