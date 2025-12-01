import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">PickleBall Shop</h3>
            <p className="text-sm text-muted-foreground">
              Hệ thống cửa hàng Pickleball chuyên nghiệp tại Việt Nam, cung cấp đầy đủ vợt, bóng
              và phụ kiện chính hãng.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Liên hệ</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-muted-foreground">
                  Địa chỉ: 236 Mỹ Đình, Phường Mỹ Đình 2, Nam Từ Liêm, Hà Nội
                </span>
              </li>
              <li>
                <span className="text-muted-foreground">Email: support@pickleballshop.com</span>
              </li>
              <li>
                <span className="text-muted-foreground">Hotline: 0982 413 244</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Dịch vụ khách hàng</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary">
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link href="/promotions" className="text-muted-foreground hover:text-primary">
                  Ưu đãi &amp; Khuyến mãi
                </Link>
              </li>
              <li>
                <Link href="/payments" className="text-muted-foreground hover:text-primary">
                  Phương thức thanh toán
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-muted-foreground hover:text-primary">
                  Điều khoản &amp; Bảo mật
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Đơn hàng</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/account/orders" className="text-muted-foreground hover:text-primary">
                  Kiểm tra đơn hàng
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="text-muted-foreground hover:text-primary">
                  Chính sách vận chuyển
                </Link>
              </li>
              <li>
                <Link href="/return-policy" className="text-muted-foreground hover:text-primary">
                  Chính sách đổi trả
                </Link>
              </li>
              <li>
                <Link href="/warranty-policy" className="text-muted-foreground hover:text-primary">
                  Chính sách bảo hành
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} PickleBall Shop. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

