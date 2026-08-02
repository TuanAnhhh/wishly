export type MessageTone = 'formal' | 'casual' | 'corporate';

export type MessageKey =
  | 'zns.invite'
  | 'zns.remind1'
  | 'zns.remind2'
  | 'zns.thanks'
  | 'zns.thanks.gift'
  | 'zns.thanks.came'
  | 'zns.thanks.absent'
  | 'zns.thanks.quiet'
  | 'email.paid'
  | 'email.rsvp'
  | 'email.report'
  | 'email.expiring30d'
  | 'email.purge7d'
  | 'email.albumPending'
  | 'email.thanksNudge'
  | 'email.albumClosing'
  | 'email.anniversary';

type MessageDef = {
  subject?: string | Record<MessageTone, string>;
  body: string | Record<MessageTone, string>;
};

/**
 * Single source of truth for ZNS / email copy (FE preview + BE send).
 * Variables: {{guest_name}}, {{bride_name}}, {{groom_name}}, {{role}},
 * {{time}}, {{weekday_date}}, {{venue}}, {{amount}}, {{plan}}, {{invoice}},
 * {{guest_count}}, {{wish}}, {{expires_at}}, {{purge_at}}, …
 */
export const MESSAGES: Record<MessageKey, MessageDef> = {
  // ZNS templates stay ≤ 200 chars with longest VN names + compact date/place vars.
  'zns.invite': {
    body: {
      formal:
        'Kính gửi {{guest_name}}, {{bride_name}} & {{groom_name}} kính mời {{role}} dự lễ thành hôn {{time}} {{weekday_date}} tại {{venue}}.',
      casual:
        'Chào {{guest_name}}! {{bride_name}} & {{groom_name}} mời {{role}} chung vui {{time}} {{weekday_date}} tại {{venue}}.',
      corporate:
        'Kính gửi {{guest_name}}, {{bride_name}} & {{groom_name}} kính mời dự lễ thành hôn {{time}} {{weekday_date}} tại {{venue}}.',
    },
  },
  'zns.remind1': {
    body: {
      formal:
        'Kính gửi {{guest_name}}, gửi lại thiệp mời {{bride_name}} & {{groom_name}} — {{time}} {{weekday_date}} tại {{venue}}. Mong {{role}} xác nhận.',
      casual:
        'Chào {{guest_name}}, gửi lại thiệp {{bride_name}} & {{groom_name}} — {{time}} {{weekday_date}} tại {{venue}}. Báo giúp nhé!',
      corporate:
        'Kính gửi {{guest_name}}, xin gửi lại lời mời {{time}} {{weekday_date}} tại {{venue}}. Mong nhận xác nhận.',
    },
  },
  'zns.remind2': {
    body: {
      formal:
        'Kính gửi {{guest_name}}, lần nhắc cuối để chốt bàn. Lễ {{time}} {{weekday_date}} tại {{venue}} — mong {{role}} xác nhận.',
      casual:
        '{{guest_name}} ơi, lần nhắc cuối chốt bàn — {{time}} {{weekday_date}} tại {{venue}}. {{role}} có tới không?',
      corporate:
        'Kính gửi {{guest_name}}, lần nhắc cuối chốt bàn. Lễ {{time}} {{weekday_date}} tại {{venue}}. Mong xác nhận.',
    },
  },
  'zns.thanks': {
    body: {
      formal:
        'Kính gửi {{guest_name}}, {{bride_name}} & {{groom_name}} cảm ơn {{role}} đã đến chung vui. Mời xem album.',
      casual:
        'Cảm ơn {{guest_name}} đã chung vui với {{bride_name}} & {{groom_name}}! Xem album nhé.',
      corporate:
        'Kính gửi {{guest_name}}, {{bride_name}} & {{groom_name}} cảm ơn quý khách. Mời xem album ảnh cưới.',
    },
  },
  'zns.thanks.gift': {
    body: {
      formal:
        'Kính gửi {{guest_name}}, {{bride_name}} & {{groom_name}} xin cảm ơn tấm lòng của {{role}}. Mời xem album.',
      casual:
        'Cảm ơn {{guest_name}} rất nhiều — {{bride_name}} & {{groom_name}} trân trọng tấm lòng. Xem album nhé!',
      corporate:
        'Kính gửi {{guest_name}}, xin cảm ơn sự quan tâm của quý khách. Mời xem album.',
    },
  },
  'zns.thanks.came': {
    body: {
      formal:
        'Kính gửi {{guest_name}}, {{bride_name}} & {{groom_name}} cảm ơn {{role}} đã đến chung vui. Mời xem album.',
      casual:
        'Cảm ơn {{guest_name}} đã chung vui với {{bride_name}} & {{groom_name}}! Xem album nhé.',
      corporate:
        'Kính gửi {{guest_name}}, cảm ơn quý khách đã đến dự. Mời xem album.',
    },
  },
  'zns.thanks.absent': {
    body: {
      formal:
        'Kính gửi {{guest_name}}, {{bride_name}} & {{groom_name}} cảm ơn {{role}} đã quan tâm và gửi lời chúc.',
      casual:
        'Cảm ơn {{guest_name}} đã nhớ đến {{bride_name}} & {{groom_name}} — mong gặp dịp khác!',
      corporate:
        'Kính gửi {{guest_name}}, xin cảm ơn quý khách đã quan tâm dù không thể đến.',
    },
  },
  /** Never mention non-attendance — design principle #2 */
  'zns.thanks.quiet': {
    body: {
      formal:
        'Kính gửi {{guest_name}}, {{bride_name}} & {{groom_name}} gửi lời cảm ơn và mời xem album ảnh.',
      casual:
        'Chào {{guest_name}}! {{bride_name}} & {{groom_name}} gửi lời cảm ơn — xem album nhé.',
      corporate:
        'Kính gửi {{guest_name}}, {{bride_name}} & {{groom_name}} gửi lời cảm ơn. Mời xem album.',
    },
  },
  'email.paid': {
    subject: 'Đã nhận thanh toán {{amount}} — thiệp của bạn đã gỡ watermark',
    body: 'Thanh toán {{amount}} cho gói {{plan}} đã được xác nhận (mã {{invoice}}). Thiệp của bạn đã gỡ watermark và sẵn sàng gửi khách đến {{expires_at}}.',
  },
  'email.rsvp': {
    subject: '{{guest_name}} đã xác nhận — {{companion_count}} người đi cùng',
    body: '{{guest_name}} vừa xác nhận tham dự ({{companion_count}} người đi cùng). Hiện có {{guest_count}} khách đã trả lời.{{wish_line}}',
  },
  'email.report': {
    subject:
      'Tổng kết đám cưới của bạn — {{attended}} khách đến, {{wishes}} lời chúc',
    body: 'Tổng kết: {{attended}} khách đến · {{wishes}} lời chúc · {{gift_total}} tiền mừng · {{views}} lượt xem. Tải sổ lưu bút và danh sách khách, hoặc tạo thiệp cảm ơn gửi khách.',
  },
  'email.expiring30d': {
    subject: 'Thiệp của bạn sẽ hết hạn trong 30 ngày',
    body: 'Thiệp «{{invitation_title}}» sẽ ngừng hiển thị vào {{expires_at}}. Gia hạn trong Trang tài khoản nếu muốn giữ link cho khách.',
  },
  'email.purge7d': {
    subject: 'Dữ liệu khách mời sẽ được xoá trong 7 ngày',
    body: 'Theo thời hạn lưu trữ, dữ liệu khách mời của thiệp «{{invitation_title}}» sẽ được ẩn danh vào {{purge_at}}. Xuất danh sách trước nếu còn cần.',
  },
  'email.albumPending': {
    subject: 'Có {{pending_count}} ảnh chờ duyệt trong album',
    body: 'Album «{{invitation_title}}» có {{pending_count}} ảnh đang chờ bạn duyệt. Ảnh chỉ hiện với khách sau khi được duyệt.',
  },
  'email.thanksNudge': {
    subject: 'Gửi thiệp cảm ơn khách mời?',
    body: 'Sự kiện «{{invitation_title}}» đã qua {{days}} ngày. Bạn có thể chép tin nhắn cảm ơn theo từng nhóm khách trong studio — không tự gửi hộ.',
  },
  'email.albumClosing': {
    subject: 'Album sắp đóng trong 3 ngày',
    body: 'Album «{{invitation_title}}» sẽ đóng upload vào {{closes_at}}. Tải về trước nếu cần — ảnh vẫn xem được sau khi đóng.',
  },
  'email.anniversary': {
    subject: 'Một năm kể từ ngày vui — xem lại tổng kết',
    body: 'Đã một năm từ «{{invitation_title}}». Xem trang tổng kết và tạo thiệp kỷ niệm nếu muốn — đây là lần nhắc cuối.',
  },
};

const VAR_RE = /\{\{([^}]+)\}\}/g;

export function renderMessage(
  key: MessageKey,
  vars: Record<string, string>,
  tone: MessageTone = 'formal'
): string {
  const def = MESSAGES[key];
  const template =
    typeof def.body === 'string' ? def.body : (def.body[tone] ?? def.body.formal);
  return substitute(template, vars);
}

export function renderSubject(
  key: MessageKey,
  vars: Record<string, string>,
  tone: MessageTone = 'formal'
): string | undefined {
  const def = MESSAGES[key];
  if (!def.subject) return undefined;
  const template =
    typeof def.subject === 'string'
      ? def.subject
      : (def.subject[tone] ?? def.subject.formal);
  return substitute(template, vars);
}

function substitute(template: string, vars: Record<string, string>): string {
  return template.replace(VAR_RE, (_, name: string) => {
    const key = name.trim();
    return vars[key] ?? '';
  });
}

/** Max length Zalo allows before truncating mid-sentence. */
export const ZNS_MAX_CHARS = 200;

export function znsCharCount(
  key: Extract<MessageKey, `zns.${string}`>,
  vars: Record<string, string>,
  tone: MessageTone = 'formal'
): number {
  return renderMessage(key, vars, tone).length;
}
