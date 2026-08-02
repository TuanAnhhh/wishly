import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  renderMessage,
  renderSubject,
  type MessageKey,
} from '@wishly/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { MAILER, type Mailer } from './mailer.service';
import {
  ctaRow,
  paragraph,
  wrapEmailHtml,
} from './templates/base.html';

const RSVP_DIGEST_THRESHOLD = 10;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MAILER) private readonly mailer: Mailer
  ) {}

  async sendPaidReceipt(input: {
    to: string;
    amount: number;
    plan: string;
    invoice: string;
    expiresAt?: string | null;
    invitationId: string;
  }) {
    const amount = `${input.amount.toLocaleString('vi-VN')}đ`;
    const expires =
      input.expiresAt ??
      new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toLocaleDateString('vi-VN');
    const vars = {
      amount,
      plan: input.plan,
      invoice: input.invoice,
      expires_at: expires,
    };
    const subject =
      renderSubject('email.paid', vars) ??
      `Đã nhận thanh toán ${amount}`;
    const body = renderMessage('email.paid', vars);
    const studio =
      process.env.PUBLIC_STUDIO_URL?.replace(/\/$/, '') ??
      'http://localhost:4201';
    const html = wrapEmailHtml({
      title: subject,
      bodyHtml:
        paragraph(body) +
        ctaRow(
          {
            label: 'Gửi thiệp cho khách',
            href: `${studio}/edit/${input.invitationId}/guests`,
          },
          { label: 'Tải hoá đơn PDF', href: `${studio}/upgrade/${input.invitationId}` }
        ),
      muteUrl: `${studio}/edit/${input.invitationId}/privacy`,
      muteLabel: 'Tắt thông báo thanh toán',
    });
    await this.safeSend({
      to: input.to,
      subject,
      html,
      messageKey: 'email.paid',
    });
  }

  /**
   * RSVP alert to invitation owner. Digests when >10 RSVPs that calendar day.
   */
  async sendRsvpAlert(input: {
    invitationId: string;
    guestName: string;
    companionCount: number;
    wish?: string | null;
  }) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: input.invitationId },
      include: { owner: { select: { email: true } } },
    });
    if (!invitation?.owner?.email) return;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.rsvp.count({
      where: {
        invitationId: input.invitationId,
        createdAt: { gte: start },
      },
    });

    // Digest mode: skip individual mail when already over threshold (except first over).
    if (todayCount > RSVP_DIGEST_THRESHOLD && todayCount !== RSVP_DIGEST_THRESHOLD + 1) {
      this.logger.debug(
        `rsvp digest skip invitation=${input.invitationId} today=${todayCount}`
      );
      return;
    }

    const total = await this.prisma.rsvp.count({
      where: { invitationId: input.invitationId },
    });
    const guestLimit = invitation.guestLimit ?? 0;
    const guestCount =
      guestLimit > 0 ? `${total}/${guestLimit} khách` : `${total} khách`;

    const vars = {
      guest_name: input.guestName,
      companion_count: String(input.companionCount),
      guest_count: guestCount,
      wish_line: input.wish
        ? ` Lời chúc: «${input.wish}».`
        : '',
    };

    const subject =
      todayCount > RSVP_DIGEST_THRESHOLD
        ? `Hôm nay đã có ${todayCount} xác nhận RSVP`
        : (renderSubject('email.rsvp', vars) ??
          `${input.guestName} đã xác nhận`);

    const body =
      todayCount > RSVP_DIGEST_THRESHOLD
        ? `Bạn nhận hơn ${RSVP_DIGEST_THRESHOLD} RSVP trong ngày — chúng tôi chuyển sang tóm tắt để không làm phiền. Hiện có ${guestCount} đã trả lời.`
        : renderMessage('email.rsvp', vars);

    const studio =
      process.env.PUBLIC_STUDIO_URL?.replace(/\/$/, '') ??
      'http://localhost:4201';
    const html = wrapEmailHtml({
      title: subject,
      bodyHtml:
        paragraph(body) +
        ctaRow({
          label: 'Xem danh sách khách',
          href: `${studio}/edit/${input.invitationId}/guests`,
        }),
      muteUrl: `${studio}/edit/${input.invitationId}/privacy`,
      muteLabel: 'Chuyển sang tóm tắt RSVP theo ngày',
    });
    await this.safeSend({
      to: invitation.owner.email,
      subject,
      html,
      messageKey: 'email.rsvp',
    });
  }

  /** Skeleton for P11 — builds HTML, safe to call with zeros. */
  async sendReport(input: {
    to: string;
    invitationId: string;
    attended: number;
    wishes: number;
    giftTotal: string;
    views: number;
  }) {
    const vars = {
      attended: String(input.attended),
      wishes: String(input.wishes),
      gift_total: input.giftTotal,
      views: String(input.views),
    };
    const subject =
      renderSubject('email.report', vars) ?? 'Tổng kết đám cưới của bạn';
    const body = renderMessage('email.report', vars);
    const studio =
      process.env.PUBLIC_STUDIO_URL?.replace(/\/$/, '') ??
      'http://localhost:4201';
    const html = wrapEmailHtml({
      title: subject,
      bodyHtml:
        paragraph(body) +
        ctaRow(
          {
            label: 'Tải sổ lưu bút và danh sách khách',
            href: `${studio}/edit/${input.invitationId}/guests`,
          },
          {
            label: 'Tạo thiệp cảm ơn gửi khách',
            href: `${studio}/dashboard`,
          }
        ),
    });
    await this.safeSend({
      to: input.to,
      subject,
      html,
      messageKey: 'email.report' satisfies MessageKey,
    });
  }

  async sendExpiring30d(input: {
    to: string;
    invitationTitle: string;
    expiresAt: string;
    invitationId: string;
  }) {
    const vars = {
      invitation_title: input.invitationTitle,
      expires_at: input.expiresAt,
    };
    const subject =
      renderSubject('email.expiring30d', vars) ??
      'Thiệp của bạn sẽ hết hạn trong 30 ngày';
    const body = renderMessage('email.expiring30d', vars);
    const studio =
      process.env.PUBLIC_STUDIO_URL?.replace(/\/$/, '') ??
      'http://localhost:4201';
    const html = wrapEmailHtml({
      title: subject,
      bodyHtml:
        paragraph(body) +
        ctaRow({
          label: 'Gia hạn thiệp',
          href: `${studio}/dashboard`,
        }),
    });
    await this.safeSend({
      to: input.to,
      subject,
      html,
      messageKey: 'email.expiring30d',
    });
  }

  async sendPurgeWarning(input: {
    to: string;
    invitationTitle: string;
    purgeAt: string;
    invitationId: string;
  }) {
    const vars = {
      invitation_title: input.invitationTitle,
      purge_at: input.purgeAt,
    };
    const subject =
      renderSubject('email.purge7d', vars) ??
      'Dữ liệu khách mời sẽ được xoá trong 7 ngày';
    const body = renderMessage('email.purge7d', vars);
    const studio =
      process.env.PUBLIC_STUDIO_URL?.replace(/\/$/, '') ??
      'http://localhost:4201';
    const html = wrapEmailHtml({
      title: subject,
      bodyHtml:
        paragraph(body) +
        ctaRow({
          label: 'Xuất danh sách khách',
          href: `${studio}/edit/${input.invitationId}/guests`,
        }),
    });
    await this.safeSend({
      to: input.to,
      subject,
      html,
      messageKey: 'email.purge7d',
    });
  }

  /** Owner-only post-event reminders (P11) — never send to guests. */
  async sendOwnerReminder(input: {
    to: string;
    invitationId: string;
    messageKey:
      | 'email.albumPending'
      | 'email.thanksNudge'
      | 'email.albumClosing'
      | 'email.anniversary';
    vars: Record<string, string>;
    ctaLabel: string;
    ctaPath: string;
  }) {
    const subject =
      renderSubject(input.messageKey, input.vars) ?? 'Nhắc từ Thiệp Việt';
    const body = renderMessage(input.messageKey, input.vars);
    const studio =
      process.env.PUBLIC_STUDIO_URL?.replace(/\/$/, '') ??
      'http://localhost:4201';
    const html = wrapEmailHtml({
      title: subject,
      bodyHtml:
        paragraph(body) +
        ctaRow({
          label: input.ctaLabel,
          href: `${studio}${input.ctaPath}`,
        }),
    });
    await this.safeSend({
      to: input.to,
      subject,
      html,
      messageKey: input.messageKey,
    });
  }

  private async safeSend(payload: {
    to: string;
    subject: string;
    html: string;
    messageKey: string;
  }) {
    try {
      await this.mailer.send(payload);
    } catch (err) {
      this.logger.error(
        `send failed key=${payload.messageKey}: ${err instanceof Error ? err.message : err}`
      );
    }
  }
}
