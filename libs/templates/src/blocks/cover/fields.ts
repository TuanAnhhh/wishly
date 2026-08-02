import type { FieldDef } from '@wishly/contracts';

export const coverFields: FieldDef[] = [
  {
    name: 'nameLeft',
    type: 'text',
    label: 'Tên bên trái',
    help: 'Tên sẽ hiển thị trên bìa thiệp.',
    placeholder: 'Ví dụ: Minh Anh…',
    required: true,
  },
  {
    name: 'nameRight',
    type: 'text',
    label: 'Tên bên phải',
    help: 'Tên sẽ hiển thị trên bìa thiệp.',
    placeholder: 'Ví dụ: Quốc Huy…',
    required: true,
  },
  {
    name: 'dateLine',
    type: 'text',
    label: 'Dòng ngày',
    placeholder: 'Ví dụ: 15 · 11 · 2026',
    required: true,
  },
  {
    name: 'placeLine',
    type: 'text',
    label: 'Dòng địa điểm ngắn',
    placeholder: 'Ví dụ: Chủ nhật · Nhà hàng Trống Đồng, Quận 1',
  },
  {
    name: 'eyebrow',
    type: 'text',
    label: 'Nhãn nhỏ trên tên',
    placeholder: 'SAVE THE DATE',
  },
  {
    name: 'guestLabel',
    type: 'text',
    label: 'Lời chào khách (tuỳ chọn)',
    help: 'Để trống nếu không muốn hiện pill “Thân mời…”.',
    placeholder: 'Ví dụ: bạn Nguyễn Thị Huệ…',
  },
  {
    name: 'coverMediaKey',
    type: 'media',
    label: 'Ảnh bìa',
    help: 'Ảnh cưới toàn khung. Có thể xuất bản trước rồi thêm ảnh sau.',
  },
  {
    name: 'showCountdown',
    type: 'boolean',
    label: 'Hiện đếm ngược',
  },
  {
    name: 'eventAt',
    type: 'datetime',
    label: 'Mốc đếm ngược',
    help: 'Ngày và giờ bắt đầu đếm ngược (giờ Việt Nam).',
    placeholder: 'Chọn ngày',
  },
];
