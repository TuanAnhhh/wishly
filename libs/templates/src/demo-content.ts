import type { InvitationContent } from '@wishly/contracts';

/** Shared demo couple — Vietnamese diacritic stress test */
export const DEMO_CONTENT: InvitationContent = {
  version: 1,
  cover: {
    guestLabel: '',
    eyebrow: 'SAVE THE DATE',
    nameLeft: 'Minh Anh',
    nameRight: 'Quốc Huy',
    dateLine: '15 · 11 · 2026',
    placeLine: 'Chủ nhật · Nhà hàng Trống Đồng, Quận 1',
    coverMediaKey: null,
    showCountdown: true,
    eventAt: '2026-11-15T18:00:00+07:00',
  },
  invite: {
    heading: 'TRÂN TRỌNG KÍNH MỜI',
    body: 'Ngày vui của chúng tôi sẽ trọn vẹn hơn khi có anh chị và gia đình đến chung vui. Kính mời anh chị đến dự bữa tiệc thân mật mừng lễ thành hôn của chúng tôi.',
    signature: 'Minh Anh & Quốc Huy',
  },
  story: {
    heading: 'Chuyện tình mình',
    items: [
      {
        year: '2019',
        title: 'Gặp nhau',
        text: 'Chung một chuyến xe đêm ra Đà Lạt, ngồi cạnh nhau vì hết chỗ.',
        mediaKey: null,
      },
      {
        year: '2022',
        title: 'Về chung nhà trọ đầu tiên',
        text: 'Căn phòng nhỏ ở Bình Thạnh, một cái bếp và rất nhiều bữa cơm tối.',
        mediaKey: null,
      },
      {
        year: '2026',
        title: 'Ngỏ lời',
        text: 'Anh hỏi ở đúng bến xe ngày xưa. Em gật đầu trước khi anh nói hết câu.',
        mediaKey: null,
      },
    ],
  },
  album: {
    heading: 'Album ảnh',
    help: 'Bấm vào ảnh để xem lớn',
    mediaKeys: [],
  },
  party: {
    heading: 'Tiệc cưới',
    datetimeLabel: '18:00 · Chủ nhật 15/11/2026',
    datetimeHelp: 'Đón khách từ 17:30',
    venueName: 'Nhà hàng Trống Đồng',
    venueAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    venueDetail: 'Sảnh Hoa Sen, lầu 2',
    schedule: [
      { label: 'Đón khách', time: '17:30' },
      { label: 'Lễ thành hôn', time: '18:00' },
      { label: 'Khai tiệc', time: '18:30' },
    ],
    mapMediaKey: null,
    mapsUrl: '',
    calendarUrl: '',
  },
  rsvp: {
    heading: 'Anh chị đến dự được không ạ?',
    help: 'Chỉ mất một phút, giúp chúng tôi chuẩn bị chỗ ngồi chu đáo.',
    acceptLabel: 'Tôi sẽ đến',
    declineLabel: 'Rất tiếc, tôi không đến được',
    wishPlaceholder: 'Chúc hai bạn trăm năm hạnh phúc…',
    submitLabel: 'Gửi xác nhận',
  },
  gift: {
    heading: 'Hộp mừng cưới',
    help: 'Sự có mặt của anh chị đã là món quà quý. Nếu ở xa không về được, anh chị có thể gửi lời chúc qua đây.',
    accounts: [
      {
        side: 'NHÀ TRAI',
        owner: 'Trần Quốc Huy',
        bank: 'Vietcombank · CN Tân Bình',
        accountNo: '0071 0004 56789',
        qrMediaKey: null,
      },
      {
        side: 'NHÀ GÁI',
        owner: 'Lê Minh Anh',
        bank: 'Techcombank · CN Quận 1',
        accountNo: '1903 6688 12345',
        qrMediaKey: null,
      },
    ],
  },
  guestbook: {
    heading: 'Sổ lưu bút',
    empty: 'Chưa có lời chúc. Hãy là người đầu tiên nhé.',
  },
};
