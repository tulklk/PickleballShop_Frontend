# SECURITY CHECKLIST

Chú giải: ✅ đã làm/kiểm chứng · ⚠️ một phần / phụ thuộc backend · ❌ chưa làm

| # | Hạng mục | Trạng thái | Ghi chú |
|---|---|---|---|
| 1 | Secrets được bảo vệ | ✅ | Secret chỉ ở biến server (không `NEXT_PUBLIC_`); `.env*` bị ignore trừ `.env.example`; bundle client không chứa tên secret. ⚠️ Quét lịch sử git cần làm thủ công; rotate nếu nghi lộ |
| 2 | Auth/authz phía server | ⚠️ | `/api/upload` ✅ (hỏi backend `/api/Auth/me`); API nghiệp vụ nằm ở backend — cần xác minh |
| 3 | IDOR đã kiểm tra | ⚠️ | Không kiểm được từ frontend; checklist backend trong `BACKEND_SECURITY_FIXES.md` |
| 4 | Admin được bảo vệ | ⚠️ | Guard client chỉ là UX; upload admin kiểm role server-side; backend phải kiểm role cho mọi endpoint admin |
| 5 | Validate input | ✅ | Upload (folder allowlist, magic bytes, size), guestCart, orderId UUID, redirect, URL; password rules ở UI |
| 6 | XSS | ✅ | DOMPurify allowlist, React nodes cho chat, JSON-LD escape, CSP nonce; có test |
| 7 | CSRF | ✅ (N/A) | API dùng Bearer header, không cookie auth → CSRF không áp dụng. Nếu backend chuyển sang cookie HttpOnly thì phải thêm SameSite + CSRF token |
| 8 | CORS | ⚠️ | Cấu hình ở backend (không đặt ở frontend); xem backend doc |
| 9 | CSP | ✅ | Nonce + strict-dynamic, kiểm local |
| 10 | Security headers | ✅ | nosniff, XFO, Referrer, Permissions, HSTS, COOP; không `X-Powered-By` |
| 11 | Rate limiting | ⚠️ | Upload có limiter best-effort; cần Vercel Firewall/Upstash + rate limit ở backend (login, đặt hàng, tra cứu đơn) |
| 12 | Order API | ⚠️ | Frontend không tin giá; backend phải tính lại, kiểm tồn kho, idempotency |
| 13 | Giá do server tính | ⚠️ | Cart chỉ gửi id/qty; backend bắt buộc tính giá từ DB |
| 14 | Payment webhook | ⚠️ | Return page chỉ là hint và đã xác nhận qua API; backend phải verify chữ ký webhook + số tiền |
| 15 | Lọc response (không lộ field nhạy cảm) | ⚠️ | Backend phải trả DTO tối thiểu (không passwordHash, token, dữ liệu user khác) |
| 16 | Dependencies đã audit | ✅ | `npm audit` = 0 |
| 17 | Production build được kiểm tra | ✅ | Build + `next start`, header runtime kiểm tra |
| 18 | Source map đã xem | ✅ | Không có `.map` ở `.next/static` (`productionBrowserSourceMaps` mặc định tắt) |
| 19 | Error handling | ✅ | Upload không lộ chi tiết/secret; log server chỉ tên lỗi; debug log tắt ở production |
| 20 | Regression tests pass | ✅ | `npm test` 70/70; `npx tsc --noEmit` sạch |
