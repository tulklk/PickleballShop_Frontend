# SECURITY AUDIT — Pickleball Shop (Frontend)

- **Phạm vi:** repo `PickleballShop_Frontend` (Next.js App Router) + build production chạy local. Backend .NET (`pickleballshop-backend.fly.dev`) là hệ thống bên ngoài, **không nằm trong repo này** — các lỗi phụ thuộc backend được ghi là `NEEDS BACKEND CHANGE` và chi tiết trong `BACKEND_SECURITY_FIXES.md`.
- **Cách làm:** đọc code tĩnh, `npm audit`, build production, chạy `next start` local và kiểm tra header/endpoint, viết test hồi quy. Không có tấn công/brute-force/flood, không sửa hay xóa dữ liệu production. Các PoC upload/XSS được tái hiện bằng test tự động, không chạy trên production.
- **Giới hạn trung thực:** backend trả HTTP 500 khi smoke test nên không kiểm thử end-to-end được luồng có dữ liệu thật (sản phẩm, đơn hàng, thanh toán). Các kết luận về những luồng đó dựa trên đọc code + test đơn vị.

---

## 1. Executive Summary

| Mức | Số lỗi | FIXED | Còn lại |
|---|---|---|---|
| Critical | 1 | 1 | 0 |
| High | 4 | 4 | 0 |
| Medium | 5 | 2 | 3 (cần backend/hạ tầng) |
| Low | 8 | 7 | 1 (cần backend ép luật mật khẩu) |
| Info | 2 | 0 | 2 |

Rủi ro lớn nhất trước khi sửa: **`/api/upload` không cần xác thực** (ai cũng upload file bất kỳ lên Cloudinary của shop), nhiều chỗ render HTML không lọc (**XSS**), thiếu **CSP/security headers**, và trang kết quả thanh toán **tin query string**. Tất cả đã được sửa ở đúng ranh giới tin cậy (server route/middleware/config), không chỉ ẩn trên UI.

Rủi ro còn lại quan trọng nhất: **token lưu ở localStorage** và **mọi quyết định giá/quyền/trạng thái thanh toán thực sự nằm ở backend** — frontend không thể thay thế (xem §Remaining Risks).

## 2. Architecture

- Next.js 15.5.x (App Router) + React 19, deploy Vercel. Phần lớn là Client Components gọi trực tiếp API backend .NET bằng `Authorization: Bearer <JWT>`.
- Auth: JWT access/refresh token từ backend, lưu `localStorage`; Google OAuth (`@react-oauth/google`); SignalR (chat hỗ trợ/thông báo).
- Thanh toán: PayOS / MoMo / VNPay — backend tạo link, redirect về `/payments/*/return`.
- Upload ảnh: `/api/upload` (Next route handler) → Cloudinary (secret chỉ ở server).
- Guard route (`RequireAuth`/`RequireAdmin`) chỉ ở client = **UX**, không phải bảo mật.

## 3. Attack Surface

| Bề mặt | Mô tả | Trạng thái sau sửa |
|---|---|---|
| `POST /api/upload` | Upload ảnh → Cloudinary | Auth + allowlist thư mục + magic-byte + 5MB + rate limit |
| `/api/chat` | Proxy OpenAI | **Đã xóa** (không có caller) |
| Render HTML | mô tả sản phẩm, tin tức, chat, mục lục, JSON-LD | DOMPurify allowlist / React nodes / escape |
| Điều hướng | `?redirect=`, URL cổng thanh toán | Chỉ path nội bộ / chỉ https |
| Return pages thanh toán | Query string do trình duyệt cung cấp | Chỉ là hint; xác nhận qua API đơn hàng |
| localStorage | token, `guestCart` | Cart được sanitize; token → rủi ro còn lại |
| Header/CSP | Không có | Middleware CSP nonce + header tĩnh |

## 4. Findings Summary

| ID | Mức | Tiêu đề | Trạng thái |
|---|---|---|---|
| SEC-001 | Critical | `/api/upload` không xác thực, không giới hạn | FIXED |
| SEC-002 | High | `/api/chat` proxy OpenAI không xác thực | FIXED (xóa) |
| SEC-003 | High | XSS qua `innerHTML`/`dangerouslySetInnerHTML` | FIXED |
| SEC-004 | High | Thiếu CSP & security headers | FIXED |
| SEC-005 | High | Trang return thanh toán tin query string | FIXED (frontend) + NEEDS BACKEND CHANGE |
| SEC-006 | Medium | Next/React & deps có lỗ hổng đã biết | FIXED |
| SEC-007 | Medium | JWT trong localStorage | NOT FIXED — NEEDS BACKEND CHANGE |
| SEC-008 | Medium | Guard admin/auth chỉ ở client | NEEDS BACKEND CHANGE (xác minh) |
| SEC-009 | Medium | Open redirect sau đăng nhập (`?redirect=`) | FIXED |
| SEC-010 | Medium | Rate limit upload in-memory (serverless) | NEEDS INFRA CHANGE |
| SEC-011 | Low | Điều hướng tới URL thanh toán không kiểm tra scheme | FIXED |
| SEC-012 | Low | `guestCart` localStorage bị giả mạo | FIXED (hiển thị) + NEEDS BACKEND CHANGE (giá) |
| SEC-013 | Low | Path param không encode | FIXED |
| SEC-014 | Low | Log debug dữ liệu nhạy cảm ở production | FIXED |
| SEC-015 | Low | Logout không xóa cache/phiên | FIXED |
| SEC-016 | Low | JSON-LD có thể thoát khỏi `<script>` | FIXED |
| SEC-017 | Low | Chính sách mật khẩu client yếu | PARTIALLY FIXED (backend phải ép) |
| SEC-018 | Low | `lookupGuestOrder` chết/không dùng | FIXED (xóa) |
| SEC-019 | Info | `swagger.json` nằm trong repo | FIXED (đã gỡ khỏi git) |
| SEC-020 | Info | Chưa quét được toàn bộ lịch sử git | Cần thao tác thủ công |

## 5. Critical

### [SEC-001] `/api/upload` không xác thực
- **Severity:** Critical — CVSS 3.1 ≈ 9.1 (AV:N/AC:L/PR:N/UI:N/S:C/C:N/I:H/A:H) — **CWE-306, CWE-434, CWE-770** — OWASP A01/A04
- **Affected:** `app/api/upload/route.ts` (`POST /api/upload`) — **Prereq:** không cần.
- **Problem:** Route nhận `file` + `folder` từ client, upload thẳng lên Cloudinary bằng secret của server; không kiểm tra đăng nhập/role, tin `Content-Type`/đuôi file, `folder` do client chọn, không giới hạn kích thước/tần suất.
- **Impact:** Kẻ ẩn danh đốt quota/chi phí Cloudinary, lưu trữ nội dung tùy ý (SVG chứa script → stored XSS khi ảnh được mở trực tiếp, nội dung độc hại/phishing dưới domain ảnh của shop), ghi vào thư mục tùy ý.
- **Evidence:** đọc code (không gọi production). PoC tái hiện bằng test `tests/security/upload.route.test.ts`.
- **Root cause:** Route handler không áp dụng authN/authZ/validation phía server.
- **Fix:**
  - Xác thực bằng cách hỏi backend `GET /api/Auth/me` (`lib/server/authenticate.ts`) — không tin role từ client, không decode JWT thủ công.
  - Allowlist thư mục + chính sách theo thư mục: `products`, `products/description`, `news`, `news/thumbnails` = **admin**; `avatars` = **user**; `reviews` = **public** (guest được review) nhưng giới hạn 5 ảnh / 10 phút / IP.
  - Kiểm tra **magic bytes** thật (JPG/PNG/GIF/WEBP; cố ý loại SVG), giới hạn 5MB, từ chối sớm theo `Content-Length`.
  - Tên file do Cloudinary sinh (`use_filename:false`, `unique_filename:true`, `overwrite:false`, `allowed_formats`).
  - Rate limit theo IP & theo user; lỗi upstream trả thông báo chung (không lộ secret/stack).
  - Client dùng `lib/api/uploadImage.ts` (gửi Bearer token).
- **Status:** **FIXED**. Nếu `CLOUDINARY_API_SECRET` từng bị chia sẻ/commit ngoài máy dev → **NEEDS SECRET ROTATION** (xem §Required Manual Actions).

## 6. High

### [SEC-002] `/api/chat` proxy OpenAI không xác thực
- **High — CWE-306, CWE-770 — A01/A04.** `app/api/chat/route.ts` cho phép ẩn danh dùng `OPENAI_API_KEY` của shop (đốt tiền, lạm dụng).
- **Fix:** route không có caller trong frontend (chat thật dùng SignalR/backend) → **xóa** thay vì vá. **Status: FIXED.** Nếu key OpenAI từng được cấu hình trên Vercel và route này đã public → cân nhắc rotate (**NEEDS SECRET ROTATION** nếu có).

### [SEC-003] XSS qua render HTML không lọc
- **High — CVSS ≈ 7.3 — CWE-79 — A03.**
- **Affected:** `app/products/[id]/page.tsx`, `app/news/[slug]/page.tsx`, `components/news/NewsContent.tsx`, `TableOfContents.tsx`, `components/chat/ChatBox.tsx`, `ZaloButton.tsx`, `components/admin/RichTextEditor.tsx`, `app/page.tsx`, `app/products/[id]/layout.tsx`.
- **Problem:** nội dung do admin/backend/AI cung cấp được gán `innerHTML`/`dangerouslySetInnerHTML` không lọc (stored XSS: một tài khoản admin bị chiếm hoặc dữ liệu độc từ backend → chạy script trên mọi khách → đánh cắp token localStorage).
- **Fix:** `lib/security/sanitizeHtml.ts` (DOMPurify allowlist, cấm script/style/iframe/form/svg/event handler/`style`, URI scheme allowlist, `rel` an toàn, **fail-closed khi SSR**) + `components/shared/SafeHtml.tsx`; chat render bằng React nodes (`lib/utils/chatFormat.ts`, không sinh HTML); mục lục dùng `DOMParser` (inert); JSON-LD escape (`lib/security/jsonLd.ts`).
- **Status: FIXED** — test: `sanitizeHtml.test.ts`, `sanitizeHtml.ssr.test.ts`, `misc.test.ts`.

### [SEC-004] Thiếu CSP và security headers
- **High (chiều sâu phòng thủ cho XSS/clickjacking) — CWE-693/1021 — A05.**
- **Fix:** `middleware.ts` + `lib/security/csp.ts`: CSP theo request với **nonce + `'strict-dynamic'`**, không `unsafe-inline`/`unsafe-eval` cho script ở production, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, `form-action 'self'`, `connect-src` chỉ self/Google/backend (https+wss). Root layout gọi `connection()` để render động (bắt buộc cho nonce). `security-headers.mjs`: `nosniff`, `X-Frame-Options: DENY`, Referrer-Policy, Permissions-Policy, HSTS, COOP `same-origin-allow-popups` (cho Google popup), `poweredByHeader:false`; `no-store` cho `/account`, `/admin`, `/checkout`, `/payments`, `/login`…, `/api`.
- **Evidence:** Build production + `next start` local: header có mặt trên `/`, `/account`, `/api/upload`; nonce khác nhau mỗi request; trang `/login` hydrate và tương tác được dưới CSP (nút hiện/ẩn mật khẩu hoạt động, 31 script có nonce).
- **Đánh đổi có chủ ý:** `style-src 'unsafe-inline'` (Tailwind/Radix/Sonner sinh inline style, không thể nonce cho style attribute); `img-src https:` (ảnh từ nhiều host). Rủi ro thấp hơn nhiều so với script inline.
- **Status: FIXED.**

### [SEC-005] Trang return thanh toán tin query string
- **High — CWE-345/602 — A04.** `/payments/payos/return?status=PAID&code=00` do **bất kỳ ai tự gõ** → UI hiển thị "thanh toán thành công", có thể dẫn khách/nhân viên tin đơn đã trả.
- **Fix:** query chỉ là *hint*; trang xác nhận qua API đơn hàng (`getGuestOrder`/`getOrderById`, poll 6×2s) rồi mới hiển thị thành công, nếu chưa rõ → trạng thái "đang xử lý"; `orderId` phải đúng UUID; MoMo/VNPay dùng lời lẽ trung tính; `checkout/success` validate `orderNumber`/`email`.
- **Status: FIXED (frontend). NEEDS BACKEND CHANGE:** đơn chỉ được chuyển `Paid` khi webhook/IPN **đã xác minh chữ ký** (xem `BACKEND_SECURITY_FIXES.md`).

## 7. Medium

### [SEC-006] Phụ thuộc có lỗ hổng
`next`/`react`/`zod`/`sharp`/`postcss` lỗi thời có advisory. **Fix:** Next `^15.5.28`, React `^19.3.1`, zod 4, sharp 0.35, override `postcss`; gỡ dep thừa (`@radix-ui/react-select`, `zustand`, `autoprefixer`). `npm audit` = **0 vulnerabilities**. **FIXED.**

### [SEC-007] JWT trong localStorage — NOT FIXED / NEEDS BACKEND CHANGE
- **CWE-922 — A02/A07.** Mọi XSS còn sót đều đọc được token. Frontend không thể chuyển sang cookie `HttpOnly` nếu backend không phát hành cookie.
- **Giảm thiểu đã làm:** SEC-003/004 (giảm khả năng XSS), logout xóa token + React Query cache (SEC-015).
- **Cần:** backend phát access/refresh token qua cookie `HttpOnly; Secure; SameSite=Lax/Strict` (kèm chống CSRF phù hợp), access token ngắn hạn, refresh rotation + revoke.

### [SEC-008] Guard chỉ ở client
`RequireAdmin`/`RequireAuth` chỉ ẩn UI; API admin **phải** kiểm role ở backend (BOLA/IDOR, function-level auth). Frontend không xác minh được. **NEEDS BACKEND CHANGE (xác minh bằng test phân quyền ở backend).** Phía Next, `/api/upload` đã xác thực + role ở server.

### [SEC-009] Open redirect sau đăng nhập
`?redirect=` được dùng trực tiếp. **Fix:** `safeInternalPath`/`resolvePostLoginPath` — chỉ path nội bộ (từ chối `//host`, `/\host`, scheme, ký tự điều khiển). **FIXED** (test `safeUrl.test.ts`).

### [SEC-010] Rate limit in-memory
`lib/security/rateLimit.ts` là best-effort (mỗi instance serverless có bộ nhớ riêng). **NEEDS INFRA CHANGE:** Vercel Firewall / Upstash Ratelimit / WAF cho `/api/upload`, `/login`, `/api/*`.

## 8. Low / Info

- **SEC-011** `navigateToPayment` chỉ chấp nhận `https:` (6 chỗ trong `app/checkout/page.tsx`) — FIXED.
- **SEC-012** `sanitizeGuestCart`: ép kiểu/độ dài/số lượng 1..999, tối đa 100 dòng; giá trong giỏ chỉ để hiển thị — FIXED (client). Backend **phải** tính giá từ DB.
- **SEC-013** `encodeURIComponent` cho path param trong `lib/api/client.ts`, `supportChatService.ts` — FIXED.
- **SEC-014** `DEBUG_API` chỉ bật khi `NODE_ENV !== "production"` **và** `NEXT_PUBLIC_DEBUG_API=true`; các `console.log` còn lại đều nằm sau cờ — FIXED.
- **SEC-015** Logout xóa token (`apiClient`) + `queryClient.clear()` — FIXED.
- **SEC-016** `safeJsonLd` escape `< > &` và U+2028/2029 — FIXED.
- **SEC-017** Mật khẩu: tối thiểu độ dài + chữ hoa/thường/số/ký tự đặc biệt ở đăng ký & đổi mật khẩu — PARTIALLY FIXED (client chỉ là UX; backend phải ép).
- **SEC-018** Gỡ `lookupGuestOrder`/`useLookupGuestOrder` không dùng — FIXED.
- **SEC-019 (Info)** `swagger.json` (dump OpenAPI backend) đã gỡ khỏi git và thêm vào `.gitignore`. File vẫn còn trên máy local nếu cần tham khảo.
- **SEC-020 (Info)** Quét lịch sử git bị chặn bởi môi trường thực thi → cần làm thủ công (§Required Manual Actions).

## 9. Hardening (đã áp dụng)
`poweredByHeader:false`, `serverExternalPackages:["sharp"]`, remotePatterns giới hạn (backend + `res.cloudinary.com/<cloud>`), `safeCloudinaryUrl` kiểm hostname thật (không `includes`), `.gitignore` bỏ qua mọi `.env*` trừ `.env.example`, `.env.example` đầy đủ & chú thích rõ secret chỉ server.

## 10. Dependency Audit
`npm audit`: **0 vulnerabilities** (sau nâng cấp). Lockfile đã cập nhật. Dev: `vitest@4`, `jsdom@25` (jsdom ≥26 cần Node ≥20.19; môi trường hiện là Node 20.17).

## 11. Security Headers (đã kiểm tra local, production build)
`Content-Security-Policy` (nonce), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `Strict-Transport-Security`, COOP; `Cache-Control: private, no-store` trên `/account`, `/api/*`; **không** có `X-Powered-By`. Không có source map trong `.next/static`; không tìm thấy tên biến secret trong bundle client.

## 12. Authentication Review
Đăng nhập/đăng ký/Google do backend xử lý. Frontend: sửa open redirect, xóa phiên khi logout, ép mật khẩu mạnh phía UI. Còn lại: token ở localStorage (SEC-007), brute-force/lockout, hết hạn/rotation token — **backend**.

## 13. Authorization Review
Route Next duy nhất có quyền (`/api/upload`) đã kiểm server-side theo role do backend xác nhận. Mọi API còn lại (đơn hàng, địa chỉ, người dùng, admin) cần backend kiểm quyền theo chủ sở hữu/role — xem `BACKEND_SECURITY_FIXES.md` (IDOR/BOLA là rủi ro số 1 cần xác minh).

## 14. E-commerce / Payment Review
Frontend không tính giá tin cậy được: giỏ hàng chỉ gửi `productId/variantId/quantity`; giá hiển thị ≠ giá thanh toán. Backend phải: tính lại giá/khuyến mãi/phí ship từ DB, kiểm tồn kho, validate voucher atomically, idempotency khi tạo đơn, webhook có xác minh chữ ký + đối chiếu số tiền/orderCode, chuyển trạng thái đơn một chiều. Return page không còn là nguồn sự thật (SEC-005).

## 15. Tests Added
`npm test` → **7 file, 70 test, tất cả pass** (`tests/security/`):
- `sanitizeHtml.test.ts` / `sanitizeHtml.ssr.test.ts` — script, handler, `javascript:`, iframe/svg/form/style, `style` attr, rel, fail-closed SSR.
- `safeUrl.test.ts` — http(s)-only, open redirect, `resolvePostLoginPath`, hostname Cloudinary.
- `upload.route.test.ts` — 401/403/200, guest review + 429, folder traversal/prototype keys (400), SVG/EXE giả ảnh (415), >5MB (413), thiếu file, tên file không dùng, lỗi upstream không lộ secret, 503 khi thiếu cấu hình.
- `authenticate.test.ts` — Bearer parsing, 401/lỗi mạng, role lấy từ backend, `isAdminUser`.
- `headers.test.ts` — CSP production/dev, middleware nonce duy nhất, header tĩnh, no-store.
- `misc.test.ts` — magic bytes, rate limit, JSON-LD, chat format, payment hint/`isPaidPaymentStatus`/UUID, `sanitizeGuestCart`.

## 16. Files Changed
Mới: `middleware.ts`, `security-headers.mjs`, `vitest.config.mts`, `lib/security/*` (csp, sanitizeHtml, safeUrl, imageSignature, imageHosts, jsonLd, rateLimit), `lib/server/authenticate.ts`, `lib/auth/roles.ts`, `lib/api/uploadImage.ts`, `lib/utils/{chatFormat,paymentStatus}.ts`, `components/shared/SafeHtml.tsx`, `tests/security/*`.
Sửa: `app/api/upload/route.ts`, `app/layout.tsx`, `next.config.mjs`, `package.json`/lock, `.env.example`, `.gitignore`, trang login/register/security/profile/checkout/success/payments (payos, momo, vnpay), news/products/home, `components/{chat,news,admin,layout}/*`, `lib/api/{client,hooks}.ts`, `lib/auth/useAuth.ts`, `lib/utils/{debugApi,guestCart}.ts`, `src/services/supportChatService.ts`, admin news/products forms.
Xóa: `app/api/chat/route.ts`.

### 16b. Cập nhật khớp backend hardening (đợt 2)
Mới: `app/(auth)/reset-password/page.tsx`, `components/auth/SessionExpiryListener.tsx`, `lib/hooks/useCooldown.ts`, `lib/validation/password.ts`, `lib/utils/{orderPayload,payosConfirm,chatLimits,pagination}.ts`, `tests/security/{hardening,apiClient}.test.ts`.
Sửa: `lib/api/{client,hooks,types}.ts` (429 + Retry-After, refresh xoay vòng single-flight, `/api/guest-orders/*`, `/api/payments/payos/confirm`, reset-password, voucher chỉ `{code}` / `{email,code,items}`, chặn PageSize ≤ 100, `getAllProducts`), `lib/utils/{guestCart,paymentStatus}.ts`, `app/(auth)/{login,register,forgot-password,verify-email}`, `app/auth/verify-email`, `app/account/{security,profile,wishlist}`, `app/{order-lookup,cart,checkout,checkout/success,payments/payos/return,products,products/[id],providers,sitemap}`, `app/admin/products`, `components/{chat/ChatBox,layout/CartPreview}`, `next.config.mjs` (`removeConsole` ở production, tắt source map), `security-headers.mjs` (`/reset-password` no-store), `tests/security/misc.test.ts`.
Không đổi: CSP/`middleware.ts` (connect-src đã có backend + wss); không thêm `vercel.json` theo quyết định của chủ dự án.

Kết quả: `tsc` exit 0 · Vitest 97/97 · `npm run build` OK (có `/reset-password`) · `npm audit` 0 lỗ hổng · header runtime của `/reset-password` và `/order-lookup` có đủ CSP nonce + no-store. `npm run lint` không chạy được tự động (ESLint chưa được cấu hình, `next lint` hỏi tương tác).

## 17. Required Manual Actions
1. **Quét lịch sử git** (agent không thực hiện được): `git log --all -p -S"CLOUDINARY_API_SECRET"`, `git log --all --name-only -- "*.env*"`, hoặc dùng `gitleaks detect` / `trufflehog git file://.`. Bằng chứng đã có: `.env.local` **không** từng được commit (kiểm tra lịch sử đường dẫn trước khi sửa) và hiện chỉ `.env.example` được track.
2. **Rotate** `CLOUDINARY_API_SECRET` (và `OPENAI_API_KEY` nếu từng đặt trên Vercel) nếu có khả năng đã lộ, vì `/api/upload` từng công khai; cập nhật trên Vercel Environment Variables.
3. Đặt `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` trên Vercel; **không** đặt `NEXT_PUBLIC_DEBUG_API` ở production.
4. Bật Vercel Firewall/rate limit cho `/api/upload` và `/login`.
5. Giao `BACKEND_SECURITY_FIXES.md` cho team backend; làm test phân quyền (IDOR) trên staging.
6. Sau deploy, kiểm tra CSP không chặn tài nguyên hợp lệ (Google login, ảnh, SignalR, PayOS redirect) trên staging; nếu có, thêm host cụ thể vào `lib/security/csp.ts`.

## 18. Remaining Risks
- Token ở localStorage (SEC-007); mọi XSS còn sót = chiếm tài khoản. Chuyển access token sang in-memory chưa làm vì refresh token vẫn phải lưu để phiên sống qua F5 và admin/SignalR đọc token trực tiếp; giải pháp triệt để là refresh token trong cookie HttpOnly do backend cấp.
- Đường dẫn chat vẫn là `/api/Chat/message` (spec chỉ nói "POST /api/chat"); cần xác nhận với backend.
- Trường địa chỉ guest vẫn tên `shippingAddress.phoneNumber`; cần xác nhận với backend nếu họ đổi thành `phone`.
- Toàn bộ authZ/pricing/payment integrity phụ thuộc backend chưa được kiểm thử ở đây.
- Rate limit không bền vững trên serverless (SEC-010).
- `img-src https:` & `style-src 'unsafe-inline'` là đánh đổi có chủ ý.
- Chưa kiểm thử end-to-end với dữ liệu thật do backend lỗi 500 lúc test.

## 19. Final Verification
| Kiểm tra | Kết quả |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm test` (Vitest) | 70/70 pass |
| `npm run build` | thành công (45 trang, Middleware 34.5 kB) |
| `npm audit` | 0 vulnerabilities |
| Source map production | 0 file `.map` trong `.next/static` |
| Secret trong client bundle (theo tên biến) | 0 |
| Header runtime (`next start` local) | đầy đủ, nonce thay đổi theo request |
| Upload runtime không auth / folder sai | 401 / 400 |
| Hydration dưới CSP | OK (smoke test `/login`) |
