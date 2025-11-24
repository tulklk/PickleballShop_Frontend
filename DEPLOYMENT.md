# Deployment Guide - PickleBall Shop Frontend

## Vercel Deployment

### Environment Variables

Khi deploy lên Vercel, bạn cần thêm các biến môi trường sau trong Vercel Dashboard:

1. **NEXT_PUBLIC_API_BASE_URL**
   - Value: `https://pickleballshop-backend.onrender.com`
   - Description: URL của backend API đã deploy trên Render

2. **NEXT_PUBLIC_GOOGLE_CLIENT_ID** (Optional)
   - Value: Google OAuth Client ID của bạn
   - Description: Cần thiết nếu muốn sử dụng Google Login

### Cách thêm Environment Variables trên Vercel:

1. Vào Vercel Dashboard
2. Chọn project của bạn
3. Vào **Settings** → **Environment Variables**
4. Thêm từng biến:
   - Key: `NEXT_PUBLIC_API_BASE_URL`
   - Value: `https://pickleballshop-backend.onrender.com`
   - Environment: Chọn **Production**, **Preview**, và **Development**
5. Click **Save**
6. **Redeploy** project để áp dụng thay đổi

### Kiểm tra kết nối API

Sau khi deploy, kiểm tra:

1. Mở Developer Console (F12)
2. Vào tab **Network**
3. Thử load trang products hoặc login
4. Kiểm tra các request đến `pickleballshop-backend.onrender.com`
5. Nếu thấy lỗi CORS, cần kiểm tra cấu hình CORS trên backend

### Troubleshooting

#### Lỗi CORS (Cross-Origin Resource Sharing)

Nếu gặp lỗi CORS, backend cần được cấu hình để cho phép requests từ domain frontend:

```
Access-Control-Allow-Origin: https://your-frontend.vercel.app
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

#### Lỗi 404 Not Found

- Kiểm tra URL backend có đúng không
- Đảm bảo backend đã deploy thành công trên Render
- Kiểm tra endpoint có đúng path không (ví dụ: `/api/Products`)

#### Lỗi 401 Unauthorized

- Kiểm tra token có được lưu đúng trong localStorage không
- Kiểm tra token có hết hạn không
- Thử login lại để lấy token mới

### Local Development

Để chạy local với backend trên Render:

1. Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=https://pickleballshop-backend.onrender.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

2. Chạy dev server:
```bash
npm run dev
```

### Build và Deploy

```bash
# Build để kiểm tra
npm run build

# Deploy lên Vercel (nếu dùng Vercel CLI)
vercel --prod
```

