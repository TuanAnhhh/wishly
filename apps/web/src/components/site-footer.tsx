import { Link } from 'react-router-dom';
import { Wordmark } from '@wishly/ui';

export function SiteFooter() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <Wordmark className="text-primary-foreground" />
          <p className="max-w-xs text-sm text-primary-foreground/70">
            Thiệp mời online — font tiếng Việt chuẩn, gửi Zalo, nhận tiền mừng
            QR.
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-medium">Sản phẩm</p>
          <ul className="space-y-2 text-primary-foreground/70">
            <li>
              <Link to="/templates" className="hover:text-primary-foreground">
                Mẫu thiệp
              </Link>
            </li>
            <li>
              <Link to="/#gia" className="hover:text-primary-foreground">
                Bảng giá
              </Link>
            </li>
            <li>
              <Link to="/create" className="hover:text-primary-foreground">
                Tạo thiệp
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-medium">Về chúng tôi</p>
          <ul className="space-y-2 text-primary-foreground/70">
            <li>
              <a
                href="https://zalo.me/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-primary-foreground"
              >
                Liên hệ Zalo
              </a>
            </li>
            <li>
              <Link
                to="/privacy-policy"
                className="hover:text-primary-foreground"
              >
                Chính sách
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-sm">
          <p className="font-medium">Công ty</p>
          <ul className="space-y-2 text-primary-foreground/70">
            <li>
              <span>Về Wishly</span>
            </li>
            <li>
              <Link
                to="/privacy-policy"
                className="hover:text-primary-foreground"
              >
                Điều khoản
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-primary-foreground/50">
          © {new Date().getFullYear()} Thiệp Việt. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </footer>
  );
}
