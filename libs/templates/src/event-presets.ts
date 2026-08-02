import {
  CORPORATE_BLOCK_ORDER,
  type BlockKey,
} from '@wishly/contracts';

import { DEMO_CONTENT } from './demo-content.js';
import type { TemplateMeta } from './types.js';

type EventType = TemplateMeta['eventType'];

/**
 * The "event" half of family × event composition (see registry.ts
 * `composeTemplate`) — block set + demo content, independent of any design
 * family. `slugSuffix` combines with a family's `id` for the composed
 * template's slug (`${familyId}-${slugSuffix}`).
 */
export type EventPreset = {
  eventType: EventType;
  name: string;
  slugSuffix: string;
  enabledBlocks: BlockKey[];
  content: Record<string, unknown>;
};

export const EVENT_PRESETS: Record<EventType, EventPreset> = {
  WEDDING: {
    eventType: 'WEDDING',
    name: 'Đám cưới',
    slugSuffix: 'cuoi',
    // Full 8-block set — the old `co-ngu` (21 real invitations) already used
    // every DEFAULT_BLOCK_ORDER key; kept as the WEDDING baseline.
    enabledBlocks: ['cover', 'invite', 'story', 'album', 'party', 'rsvp', 'gift', 'guestbook'],
    content: DEMO_CONTENT,
  },
  BIRTHDAY: {
    eventType: 'BIRTHDAY',
    name: 'Sinh nhật',
    slugSuffix: 'sinh-nhat',
    enabledBlocks: ['cover', 'invite', 'party', 'rsvp', 'guestbook'],
    content: {
      ...DEMO_CONTENT,
      cover: {
        ...DEMO_CONTENT.cover!,
        nameLeft: 'Bé An',
        nameRight: '5 tuổi',
        eyebrow: 'SINH NHẬT',
        showCountdown: true,
      },
      invite: {
        heading: 'Mời bạn đến dự',
        body: 'Gia đình chúng tôi trân trọng kính mời anh chị đến chung vui sinh nhật bé An.',
        signature: 'Gia đình bé An',
      },
      party: {
        ...DEMO_CONTENT.party!,
        heading: 'Tiệc sinh nhật',
      },
      gift: undefined,
    },
  },
  BABY_MONTH: {
    eventType: 'BABY_MONTH',
    name: 'Đầy tháng',
    // Matches the existing slug convention already shipped (`day-thang-cat`,
    // `day-thang-sen`) — see Unresolved #5, "thôi nôi" was the alternative,
    // not chosen since nothing already in production uses it.
    slugSuffix: 'day-thang',
    enabledBlocks: ['cover', 'invite', 'party', 'rsvp'],
    content: {
      ...DEMO_CONTENT,
      cover: {
        ...DEMO_CONTENT.cover!,
        nameLeft: 'Bé Bin',
        nameRight: 'Đầy tháng',
        eyebrow: 'ĐẦY THÁNG',
        showCountdown: false,
      },
      invite: {
        heading: 'Trân trọng kính mời',
        body: 'Gia đình chúng tôi kính mời anh chị đến chung vui lễ đầy tháng của bé.',
        signature: 'Gia đình bé Bin',
      },
      party: {
        ...DEMO_CONTENT.party!,
        heading: 'Lễ đầy tháng',
      },
    },
  },
  CORPORATE: {
    eventType: 'CORPORATE',
    name: 'Sự kiện công ty',
    slugSuffix: 'su-kien',
    enabledBlocks: CORPORATE_BLOCK_ORDER.filter((b) => b.enabled).map((b) => b.key),
    // Reuses the old `corporate-year-end` demo content — already generic
    // ("Công ty ABC") placeholder data, not tied to any real customer.
    content: {
      version: 1,
      cover: {
        guestLabel: 'Kính gửi',
        eyebrow: 'YEAR-END GALA',
        nameLeft: 'Công ty ABC',
        nameRight: 'Tất niên 2026',
        dateLine: '19:00 · Thứ Sáu 18/12/2026',
        placeLine: 'Trống Đồng Palace, Hà Nội',
        coverMediaKey: null,
        showCountdown: true,
        eventAt: '2026-12-18T19:00:00+07:00',
      },
      invite: {
        heading: 'TRÂN TRỌNG KÍNH MỜI',
        body: 'Ban Lãnh đạo Công ty ABC trân trọng kính mời Quý vị đến dự tiệc Tất niên 2026 — cùng nhìn lại một năm nỗ lực và chào đón năm mới.',
        signature: 'Ban Tổ chức',
      },
      agenda: {
        heading: { vi: 'Chương trình', en: 'Agenda' },
        items: [
          {
            time: { vi: '18:30', en: '18:30' },
            title: { vi: 'Đón khách', en: 'Welcome reception' },
            desc: { vi: 'Check-in tại sảnh A', en: 'Check-in at Lobby A' },
          },
          {
            time: { vi: '19:00', en: '19:00' },
            title: { vi: 'Khai mạc', en: 'Opening remarks' },
          },
          {
            time: { vi: '19:30', en: '19:30' },
            title: { vi: 'Tiệc đứng & giao lưu', en: 'Dinner & networking' },
          },
          {
            time: { vi: '21:00', en: '21:00' },
            title: { vi: 'Vinh danh', en: 'Awards' },
            desc: { vi: 'Giải thưởng nội bộ năm', en: 'Internal annual awards' },
          },
        ],
      },
      practical: {
        heading: { vi: 'Thông tin cần biết', en: 'Good to know' },
        items: [
          {
            label: { vi: 'Trang phục', en: 'Dress code' },
            value: { vi: 'Business casual', en: 'Business casual' },
          },
          {
            label: { vi: 'Bãi đỗ xe', en: 'Parking' },
            value: { vi: 'Tầng B1 — miễn phí', en: 'Basement B1 — complimentary' },
          },
          {
            label: { vi: 'Liên hệ', en: 'Contact' },
            value: { vi: 'HCNS · 0901 234 567', en: 'HR · 0901 234 567' },
          },
        ],
      },
      party: {
        heading: 'Thời gian & địa điểm',
        datetimeLabel: '19:00 · Thứ Sáu 18/12/2026',
        datetimeHelp: 'Đón khách từ 18:30',
        venueName: 'Trống Đồng Palace',
        venueAddress: 'Số 1 Trống Đồng, Hà Nội',
        venueDetail: 'Sảnh Hoàng Gia',
        schedule: [],
        mapMediaKey: null,
        mapsUrl: '',
        calendarUrl: '',
      },
      'entry-pass': {
        heading: { vi: 'Thẻ vào cổng', en: 'Entry pass' },
        help: {
          vi: 'Đưa mã này tại quầy đón khách',
          en: 'Show this code at the reception desk',
        },
      },
      rsvp: {
        heading: 'Quý vị sẽ tham dự chứ ạ?',
        help: 'Xác nhận giúp chúng tôi chuẩn bị suất ăn phù hợp.',
        acceptLabel: 'Tôi sẽ đến',
        declineLabel: 'Rất tiếc, tôi bận',
        wishPlaceholder: 'Lời nhắn gửi Ban Tổ chức (không bắt buộc)',
        submitLabel: 'Gửi xác nhận',
      },
    },
  },
};
