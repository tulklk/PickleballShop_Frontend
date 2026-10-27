import { NextResponse, type NextRequest } from "next/server";
import { buildCsp } from "@/lib/security/csp";

/**
 * Gắn CSP có nonce cho mọi response HTML/API.
 * Nonce được truyền qua request header để Next.js tự gắn vào script của framework.
 * (Root layout gọi `connection()` để buộc render động, vì nonce yêu cầu render theo request.)
 */
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV !== "production",
    apiBaseUrl:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "https://pickleballshop-backend.fly.dev",
  });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Bỏ qua file tĩnh và prefetch (không cần CSP riêng / nonce).
      source: "/((?!_next/static|_next/image|favicon.ico|icon.png|img/|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt|xml)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
