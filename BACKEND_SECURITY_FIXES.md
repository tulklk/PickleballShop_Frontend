# BACKEND SECURITY FIXES (cho backend .NET — `pickleballshop-backend`)

Frontend **không thể** thay thế các quy tắc dưới đây. Mỗi mục là điều kiện bắt buộc để hệ thống thực sự an toàn. Chưa được kiểm thử trực tiếp từ repo frontend (backend ngoài phạm vi và lúc test trả HTTP 500) — hãy xác minh trên **staging**.

## 1. Authorization (ưu tiên cao nhất)
- Mọi endpoint admin (`/api/Admin/*`, quản lý sản phẩm/đơn/user/voucher/tin tức/báo cáo) phải có `[Authorize(Roles="Admin")]` ở **controller/action**; không dựa vào ẩn UI.
- **IDOR/BOLA:** mọi endpoint theo `id` (đơn hàng, địa chỉ, wishlist, giỏ hàng, hồ sơ, chat) phải kiểm `resource.OwnerId == currentUserId` (hoặc Admin). Trả `404` thay vì `403` để tránh dò id. Không nhận `userId` từ body/query để xác định chủ sở hữu — lấy từ claim JWT.
- **Mass assignment:** DTO riêng cho request; không bind trực tiếp entity. Chặn client tự đặt `role`, `isAdmin`, `status`, `paymentStatus`, `totalAmount`, `emailConfirmed`.
- `/api/Auth/me` trả đúng role/id (đang được Next dùng để xác thực upload) — giữ ổn định, không cache chia sẻ.

## 2. Tạo đơn hàng & giá
- Tính lại **toàn bộ** giá từ DB: đơn giá, giảm giá, voucher, phí ship, thuế, tổng. Bỏ qua mọi `unitPrice`/`total` do client gửi.
- Kiểm: `quantity` nguyên 1..N, sản phẩm/biến thể tồn tại và đang bán, tồn kho (trừ kho trong transaction, chống race/oversell).
- Voucher: kiểm hạn, điều kiện tối thiểu, giới hạn số lần/người, tăng bộ đếm **atomic** (chống dùng song song).
- **Idempotency key** cho tạo đơn/tạo thanh toán (tránh đơn trùng khi double-click/retry).
- Guest checkout & tra cứu đơn guest: yêu cầu `orderNumber` **và** email khớp; token tra cứu khó đoán (không tuần tự); **rate limit** + phản hồi đồng nhất để tránh enumeration.
- Chuyển trạng thái đơn theo máy trạng thái một chiều; user chỉ được hủy trong điều kiện cho phép.

## 3. Thanh toán (PayOS / MoMo / VNPay)
- Chỉ đặt `Paid` khi **webhook/IPN đã xác minh chữ ký** (checksum key) **và** đối chiếu `orderCode`, `amount`, `currency` với đơn trong DB.
- Webhook idempotent (xử lý lặp không cộng/đổi trạng thái hai lần); log + cảnh báo khi chữ ký sai hoặc số tiền lệch.
- Endpoint return/redirect không được là nguồn xác nhận thanh toán. Endpoint webhook không yêu cầu auth người dùng nhưng phải giới hạn theo chữ ký (và nếu có thể allowlist IP của nhà cung cấp).
- `paymentUrl` trả về phải là `https://` thuộc domain cổng thanh toán (frontend đã chặn scheme lạ nhưng backend nên tự bảo đảm).
- Không lưu/ghi log dữ liệu thẻ hoặc secret.

## 4. Authentication & phiên
- **Khuyến nghị:** phát token qua cookie `HttpOnly; Secure; SameSite=Lax|Strict` thay vì để frontend lưu localStorage; nếu chuyển → thêm chống CSRF (SameSite + token cho thao tác thay đổi trạng thái).
- Access token ngắn hạn (≤15 phút), refresh token **rotation** + phát hiện tái sử dụng + revoke khi đổi mật khẩu/logout; endpoint logout vô hiệu refresh token phía server.
- Chống brute-force: giới hạn theo IP + theo tài khoản, lockout/backoff, CAPTCHA khi bất thường; phản hồi login/forgot-password **không** phân biệt email tồn tại hay không.
- Mật khẩu: ép tối thiểu độ dài (≥10–12) + kiểm tra mật khẩu bị lộ; băm bằng Argon2id/bcrypt/PBKDF2 (ASP.NET Identity mặc định); không trả hash ở bất kỳ response nào.
- Token xác minh email/đặt lại mật khẩu: ngẫu nhiên mạnh, dùng một lần, hết hạn ngắn.
- Google OAuth: xác minh ID token phía server (audience = client id, issuer, exp), không tin email chưa `email_verified`.

## 5. Validation & đầu ra
- Validate server-side mọi input (độ dài, kiểu, định dạng, enum); dùng truy vấn tham số hóa/EF Core (không nối chuỗi SQL).
- **Lọc response:** DTO tối thiểu; không trả `passwordHash`, token, thông tin nội bộ, dữ liệu user khác; ẩn stack trace (ProblemDetails chung ở production).
- Sanitize/giới hạn HTML của mô tả sản phẩm/tin tức **ngay khi lưu** (allowlist phía server, ví dụ HtmlSanitizer) — lớp phòng thủ thứ hai bên cạnh DOMPurify ở frontend.
- Nếu backend có upload riêng: kiểm magic bytes, giới hạn kích thước, không phục vụ SVG/HTML từ domain chính, `Content-Disposition`/`nosniff`.

## 6. CORS & transport
- CORS allowlist **chính xác** origin frontend (`https://pickleball-shop-frontend.vercel.app` + domain tùy chỉnh); không `*` khi `AllowCredentials`; giới hạn method/header.
- Bắt buộc HTTPS + HSTS; SignalR hub: yêu cầu auth, kiểm origin, kiểm quyền theo group (user chỉ nghe kênh của mình; chat admin chỉ role Admin).

## 7. Rate limiting & chống lạm dụng
- ASP.NET `RateLimiter` theo IP/user cho: login, register, forgot/reset password, tra cứu đơn guest, tạo đơn, áp voucher, review, gửi chat/contact.
- Giới hạn kích thước body/số phần tử trong danh sách (giỏ hàng, items đơn).

## 8. Logging & vận hành
- Log sự kiện bảo mật (login fail, 403/401 bất thường, webhook sai chữ ký, thay đổi role) — **không** log mật khẩu/token/dữ liệu thanh toán.
- Header bảo mật cho API: `X-Content-Type-Options: nosniff`, `Cache-Control: no-store` cho response nhạy cảm.
- Tắt Swagger UI ở production hoặc đặt sau auth.
- Bí mật (JWT signing key, DB, PayOS/MoMo/VNPay keys) lưu trong Fly secrets; rotate nếu từng lộ; JWT key đủ dài/ngẫu nhiên, kiểm `iss/aud/exp`.

## 9. Test phân quyền gợi ý (staging, tài khoản test của bạn)
1. User A gọi `GET/PUT/DELETE` trên đơn/địa chỉ của user B → phải 404/403.
2. User thường gọi mọi endpoint admin → 403.
3. Tạo đơn với `unitPrice=1`/`total=1`/`quantity=-1`/voucher dùng lại → server bỏ qua/từ chối.
4. Gọi webhook với chữ ký sai/số tiền lệch → từ chối, không đổi trạng thái.
5. Đăng ký/PUT profile kèm `"role":"Admin"` → bị bỏ qua.
