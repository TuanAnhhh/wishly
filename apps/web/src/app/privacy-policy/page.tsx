import { useState } from 'react';
import { SiteFooter } from '../../components/site-footer';
import { SiteHeader } from '../../components/site-header';

type SectionId =
  | 'collect'
  | 'use'
  | 'access'
  | 'retention'
  | 'rights'
  | 'security'
  | 'contact';

const SECTIONS: Array<{ id: SectionId; no: string; title: string }> = [
  { id: 'collect', no: 'MỤC 1', title: 'Chúng tôi thu những gì' },
  { id: 'use', no: 'MỤC 2', title: 'Dùng để làm gì' },
  { id: 'access', no: 'MỤC 3', title: 'Ai thấy được dữ liệu' },
  { id: 'retention', no: 'MỤC 4', title: 'Giữ bao lâu rồi xoá' },
  { id: 'rights', no: 'MỤC 5', title: 'Quyền của bạn và của khách' },
  { id: 'security', no: 'MỤC 6', title: 'Chúng tôi bảo vệ thế nào' },
  { id: 'contact', no: 'MỤC 7', title: 'Liên hệ và khiếu nại' },
];

/**
 * Ported from privacy-data.md §04/05 (Nghị định 13/2023/NĐ-CP).
 * ⚠️ Placeholders below (legal entity name, address, email, hotline) are
 * NOT real — must be replaced with real values from P00 before this page
 * is allowed on production. Publishing fake contact info is worse than no
 * policy page at all.
 */
export function PrivacyPolicyPage() {
  const [active, setActive] = useState<SectionId>('collect');

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          <p className="text-xs text-secondary-foreground">
            Cập nhật 28/07/2026 (bản nháp — chưa công bố)
          </p>
          <nav className="flex flex-col gap-1 text-sm">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={`rounded-sm px-2 py-2 text-left ${
                  active === s.id
                    ? 'bg-muted font-medium text-primary'
                    : 'text-secondary-foreground'
                }`}
              >
                {s.no}. {s.title}
              </button>
            ))}
          </nav>
        </aside>

        <article className="space-y-4">
          {active === 'collect' ? (
            <>
              <h1 className="font-serif text-2xl leading-[1.25]">
                Chúng tôi thu những gì
              </h1>
              <p className="text-secondary-foreground">
                Chỉ thu những gì cần để thiệp chạy được. Không thu thông tin
                sức khoẻ, tôn giáo, tài chính hay vị trí của bạn.
              </p>
              <h3 className="font-medium">Của bạn — người tạo thiệp</h3>
              <p className="text-secondary-foreground">
                Số điện thoại hoặc email để đăng nhập, tên hiển thị, nội dung
                thiệp và ảnh bạn tải lên. Nếu bạn nhận tiền mừng, chúng tôi lưu
                số tài khoản để sinh mã QR — chúng tôi không giữ tiền và không
                xem được số dư của bạn.
              </p>
              <h3 className="font-medium">Của khách mời</h3>
              <p className="text-secondary-foreground">
                Tên và số điện thoại bạn nhập vào danh sách, cùng câu trả lời
                tham dự, số người đi kèm và lời chúc mà khách tự gửi. Khách
                không cần tạo tài khoản để xem thiệp.
              </p>
            </>
          ) : null}

          {active === 'use' ? (
            <>
              <h1 className="font-serif text-2xl leading-[1.25]">
                Dùng để làm gì
              </h1>
              <p className="text-secondary-foreground">
                Mỗi loại dữ liệu chỉ dùng đúng một việc. Chúng tôi không bán,
                không cho thuê, không đổi dữ liệu của bạn hay của khách cho
                bên thứ ba.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-secondary-foreground">
                <li>Tên khách mời → hiện lời chào riêng trên thiệp</li>
                <li>
                  Số điện thoại khách → gửi thiệp mời và tối đa hai lời nhắc;
                  không dùng vào việc khác
                </li>
                <li>Phản hồi tham dự → tính số khách và số bàn cho bạn</li>
                <li>Lời chúc → hiện trong sổ lưu bút của thiệp</li>
                <li>
                  Số tài khoản của bạn → sinh mã QR nhận tiền mừng; tiền vào
                  thẳng ngân hàng của bạn
                </li>
              </ul>
            </>
          ) : null}

          {active === 'access' ? (
            <>
              <h1 className="font-serif text-2xl leading-[1.25]">
                Ai thấy được dữ liệu
              </h1>
              <p className="text-secondary-foreground">
                Danh sách khách chỉ thuộc về bạn. Khách không thấy được nhau,
                nhân viên chúng tôi cũng không xem tuỳ ý.
              </p>
              <p className="text-secondary-foreground">
                Bên thứ ba chúng tôi dùng: Zalo để gửi tin, một nhà cung cấp
                máy chủ đặt tại Việt Nam để lưu dữ liệu, và cổng thanh toán khi
                bạn nâng cấp. Họ chỉ nhận đúng phần dữ liệu cần cho việc đó.
              </p>
            </>
          ) : null}

          {active === 'retention' ? (
            <>
              <h1 className="font-serif text-2xl leading-[1.25]">
                Giữ bao lâu rồi xoá
              </h1>
              <p className="text-secondary-foreground">
                Dữ liệu khách có thời hạn, không giữ mãi. Bạn tự chọn thời hạn
                trong phần cài đặt riêng tư.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-secondary-foreground">
                <li>Dữ liệu khách mời — 3, 6 hoặc 12 tháng sau sự kiện, bạn chọn</li>
                <li>Nội dung thiệp và ảnh — 12 tháng kể từ ngày xuất bản, gia hạn được</li>
                <li>Tài khoản của bạn — đến khi bạn yêu cầu xoá</li>
                <li>Hoá đơn thanh toán — 10 năm theo quy định kế toán</li>
              </ul>
            </>
          ) : null}

          {active === 'rights' ? (
            <>
              <h1 className="font-serif text-2xl leading-[1.25]">
                Quyền của bạn và của khách
              </h1>
              <p className="text-secondary-foreground">
                Theo Nghị định 13/2023/NĐ-CP, bạn và khách mời có các quyền
                sau với dữ liệu của mình, thực hiện được ngay trong sản phẩm:
              </p>
              <ul className="list-disc space-y-1 pl-5 text-secondary-foreground">
                <li>Được biết dữ liệu nào của mình đang được xử lý</li>
                <li>Được xem và tải bản sao (Excel) bất cứ lúc nào</li>
                <li>Được sửa tên, số điện thoại, câu trả lời</li>
                <li>Được xoá — thực hiện trong 72 giờ</li>
                <li>Được rút lại đồng ý mà không cần nêu lý do</li>
                <li>Được phản đối và khiếu nại với chúng tôi hoặc cơ quan quản lý nhà nước</li>
              </ul>
            </>
          ) : null}

          {active === 'security' ? (
            <>
              <h1 className="font-serif text-2xl leading-[1.25]">
                Chúng tôi bảo vệ thế nào
              </h1>
              <p className="text-secondary-foreground">
                Đường truyền mã hoá, dữ liệu lưu trên máy chủ tại Việt Nam, số
                tài khoản ngân hàng được mã hoá riêng. Nhân viên chỉ truy cập
                khi bạn yêu cầu hỗ trợ.
              </p>
              <p className="text-secondary-foreground">
                Nếu xảy ra rò rỉ: chúng tôi thông báo cho bạn trong 72 giờ kể
                từ khi phát hiện, nói rõ dữ liệu nào bị ảnh hưởng, đồng thời
                báo cơ quan chức năng theo quy định.
              </p>
            </>
          ) : null}

          {active === 'contact' ? (
            <>
              <h1 className="font-serif text-2xl leading-[1.25]">
                Liên hệ và khiếu nại
              </h1>
              <p className="text-secondary-foreground">
                Bên chịu trách nhiệm: [Tên pháp nhân — chờ P00], [Địa chỉ —
                chờ P00]. Người phụ trách bảo vệ dữ liệu cá nhân: [email — chờ
                P00].
              </p>
              <p className="text-secondary-foreground">
                Nếu bạn không hài lòng, bạn có quyền khiếu nại tới Cục An ninh
                mạng và phòng, chống tội phạm sử dụng công nghệ cao (A05), Bộ
                Công an.
              </p>
            </>
          ) : null}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

export default PrivacyPolicyPage;
