import type { InvitationContent } from '@wishly/contracts';

import { DEMO_CONTENT } from './demo-content.js';
import type { EntryPassData } from './types.js';

/**
 * Official diacritic stress strings for template verify.
 * Source: phase-02 + Thiệp Việt Design System readme.
 */
export const VERIFY_STRINGS = {
  nameLeft: 'Nguyễn Thị Hường',
  nameRight: 'Đỗ Quốc Huy',
  ceremony: 'Lễ Thành Hôn',
  place: '15 tháng 11 · Nhà hàng Trống Đồng, Quận 1',
  /** NFC single code points — must all appear in invite body */
  hardGlyphs: 'ễộữỡặẩẫựườỹẾỘỮẰỸỢ',
  body: 'ẾỘỮẰỸỢ ếộữỡặẩẫựườỹợ Nguyễn Đình Quốc Huy tiệc cưới lưu bút mừng',
} as const;

/** Content injected into every template during verify-template.ts */
export const VERIFY_CONTENT: InvitationContent = {
  ...DEMO_CONTENT,
  cover: {
    ...DEMO_CONTENT.cover!,
    nameLeft: VERIFY_STRINGS.nameLeft,
    nameRight: VERIFY_STRINGS.nameRight,
    dateLine: '15 · 11 · 2026',
    placeLine: VERIFY_STRINGS.place,
    eyebrow: VERIFY_STRINGS.ceremony,
  },
  invite: {
    ...DEMO_CONTENT.invite!,
    body: VERIFY_STRINGS.body,
    signature: `${VERIFY_STRINGS.nameLeft} & ${VERIFY_STRINGS.nameRight}`,
  },
  party: {
    ...DEMO_CONTENT.party!,
    heading: VERIFY_STRINGS.ceremony,
    datetimeLabel: '18:00 · Chủ nhật 15/11/2026',
    venueAddress: VERIFY_STRINGS.place,
  },
  // DEMO_CONTENT has no agenda/practical/entry-pass keys at all (those blocks
  // only render for CORPORATE templates), so before this addition the corp
  // blocks never got Vietnamese stress-string coverage in the verify gate —
  // `AgendaContentSchema`/`PracticalContentSchema` default to English
  // placeholder text on `{}`, which parses fine but has 0 hard glyphs.
  agenda: {
    heading: { vi: VERIFY_STRINGS.ceremony, en: 'Agenda' },
    items: [
      {
        time: { vi: '18:00', en: '18:00' },
        title: { vi: VERIFY_STRINGS.ceremony, en: 'Ceremony' },
        desc: { vi: VERIFY_STRINGS.body, en: 'Ceremony program' },
      },
    ],
  },
  practical: {
    heading: { vi: 'Thông tin cần biết', en: 'Good to know' },
    items: [
      {
        label: { vi: 'Địa điểm', en: 'Venue' },
        value: { vi: VERIFY_STRINGS.place, en: VERIFY_STRINGS.place },
      },
    ],
  },
  'entry-pass': {
    heading: { vi: 'Thẻ vào cổng', en: 'Entry pass' },
    help: { vi: VERIFY_STRINGS.body, en: 'Show this code at reception' },
  },
};

/**
 * `entry-pass` returns `null` without `interactions.entryPass.passCode`
 * (`blocks/entry-pass/index.tsx:34`) — a shared-slug-link guard, not a
 * verify-content gap. The dev page must pass this stub so the block (and
 * its canvas-based `saveAsImage`, the one thing in this codebase that
 * hardcodes hex/fonts outside the `--inv-*` token system) actually renders
 * during verify. Fake data only, never a real passCode.
 */
export const VERIFY_ENTRY_PASS: EntryPassData = {
  passCode: 'VERIFY-0000',
  guestName: `${VERIFY_STRINGS.nameLeft} & ${VERIFY_STRINGS.nameRight}`,
  tableLabel: 'B12',
};

export const VERIFY_VIEWPORTS = [390, 768, 1440] as const;
