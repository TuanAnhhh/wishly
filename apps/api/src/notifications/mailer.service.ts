import { Injectable, Logger } from '@nestjs/common';

export type MailPayload = {
  to: string;
  subject: string;
  html: string;
  /** For logging only — never log full body (PII). */
  messageKey: string;
};

export interface Mailer {
  send(payload: MailPayload): Promise<void>;
}

function maskEmail(to: string): string {
  const [user, domain] = to.split('@');
  if (!domain) return '***';
  const u = user ?? '';
  const shown = u.length <= 2 ? '*' : `${u.slice(0, 2)}***`;
  return `${shown}@${domain}`;
}

@Injectable()
export class ConsoleMailer implements Mailer {
  private readonly logger = new Logger('Mailer:console');

  async send(payload: MailPayload): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn(
        `MAIL_DRIVER=console in production — email not delivered (key=${payload.messageKey} to=${maskEmail(payload.to)})`
      );
    }
    this.logger.log(
      `[console] key=${payload.messageKey} to=${maskEmail(payload.to)} subject=${payload.subject}`
    );
  }
}

/** Minimal SMTP via nodemailer-shaped env; falls back to console if unset. */
@Injectable()
export class SmtpMailer implements Mailer {
  private readonly logger = new Logger('Mailer:smtp');
  private readonly console = new ConsoleMailer();

  async send(payload: MailPayload): Promise<void> {
    const host = process.env.SMTP_HOST;
    if (!host) {
      this.logger.warn('SMTP_HOST missing — falling back to console');
      return this.console.send(payload);
    }
    // Lightweight fetch to a relay is out of scope; log + console until Resend/SES chosen.
    this.logger.warn(
      `SMTP driver stub (host=${host}) — logging only until provider wired (key=${payload.messageKey})`
    );
    return this.console.send(payload);
  }
}

export const MAILER = Symbol('MAILER');

export function createMailer(): Mailer {
  const driver = (process.env.MAIL_DRIVER ?? 'console').toLowerCase();
  if (driver === 'smtp' || driver === 'resend') {
    return new SmtpMailer();
  }
  return new ConsoleMailer();
}
