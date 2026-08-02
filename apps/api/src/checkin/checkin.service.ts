import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  formatPassCode,
  normalizePassCode,
  passCodePrefix,
  type CheckinSyncBatch,
  type CheckinWalkIn,
  type CreateStaffAccess,
} from '@wishly/contracts';
import { customAlphabet } from 'nanoid';
import type { AuthUser } from '../auth/auth.types';
import type { StaffContext } from '../auth/staff.decorator';
import { InvitationsService } from '../invitations/invitations.service';
import { PrismaService } from '../prisma/prisma.service';
import { ensurePassCodes } from './passcode-assign';

const staffNano = customAlphabet(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  16
);

function maskPhone(phone: string | null): string | null {
  if (!phone) return null;
  if (phone.length <= 6) return `${phone.slice(0, 2)}****`;
  return `${phone.slice(0, 3)}****${phone.slice(-3)}`;
}

@Injectable()
export class CheckinService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitations: InvitationsService
  ) {}

  async roster(staff: StaffContext) {
    const guests = await this.prisma.guest.findMany({
      where: { invitationId: staff.invitationId },
      orderBy: [{ name: 'asc' }],
      select: {
        id: true,
        name: true,
        group: true,
        phone: true,
        partySize: true,
        passCode: true,
        checkedInAt: true,
        walkIn: true,
        table: { select: { id: true, label: true } },
      },
    });
    return {
      invitationId: staff.invitationId,
      fetchedAt: new Date().toISOString(),
      guests: guests.map((g) => ({
        id: g.id,
        name: g.name,
        group: g.group,
        phone: maskPhone(g.phone),
        partySize: g.partySize,
        passCode: g.passCode,
        checkedInAt: g.checkedInAt,
        walkIn: g.walkIn,
        tableId: g.table?.id ?? null,
        tableLabel: g.table?.label ?? null,
      })),
    };
  }

  async scan(staff: StaffContext, passCodeRaw: string) {
    const passCode = normalizePassCode(passCodeRaw);
    const guest = await this.prisma.guest.findUnique({
      where: { passCode },
      include: { table: { select: { label: true } } },
    });
    if (!guest || guest.invitationId !== staff.invitationId) {
      return { result: 'invalid' as const };
    }
    if (guest.checkedInAt) {
      return {
        result: 'dup' as const,
        at: guest.checkedInAt.toISOString(),
        guest: this.guestPayload(guest),
      };
    }
    const updated = await this.prisma.guest.update({
      where: { id: guest.id },
      data: { checkedInAt: new Date(), checkedInBy: staff.label },
      include: { table: { select: { label: true } } },
    });
    return { result: 'ok' as const, guest: this.guestPayload(updated) };
  }

  async manual(staff: StaffContext, guestId: string) {
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
      include: { table: { select: { label: true } } },
    });
    if (!guest || guest.invitationId !== staff.invitationId) {
      return { result: 'invalid' as const };
    }
    if (guest.checkedInAt) {
      return {
        result: 'dup' as const,
        at: guest.checkedInAt.toISOString(),
        guest: this.guestPayload(guest),
      };
    }
    const updated = await this.prisma.guest.update({
      where: { id: guest.id },
      data: { checkedInAt: new Date(), checkedInBy: staff.label },
      include: { table: { select: { label: true } } },
    });
    return { result: 'ok' as const, guest: this.guestPayload(updated) };
  }

  async walkIn(staff: StaffContext, input: CheckinWalkIn) {
    if (input.tableId) {
      const table = await this.prisma.seatingTable.findUnique({
        where: { id: input.tableId },
      });
      if (!table || table.invitationId !== staff.invitationId) {
        throw new BadRequestException('Bàn không thuộc thiệp này.');
      }
    }
    const invitation = await this.prisma.invitation.findUniqueOrThrow({
      where: { id: staff.invitationId },
      select: { slug: true, eventDate: true },
    });
    const passCode = await this.nextPassCode(
      staff.invitationId,
      invitation.slug,
      invitation.eventDate
    );
    const token = await this.uniqueGuestToken();
    const guest = await this.prisma.guest.create({
      data: {
        invitationId: staff.invitationId,
        name: input.name.trim(),
        partySize: input.partySize ?? 1,
        partySizeManual: true,
        tableId: input.tableId ?? null,
        walkIn: true,
        passCode,
        token,
        checkedInAt: new Date(),
        checkedInBy: staff.label,
      },
      include: { table: { select: { label: true } } },
    });
    return { result: 'ok' as const, guest: this.guestPayload(guest) };
  }

  /** Idempotent: keep earliest checkedInAt. */
  async sync(staff: StaffContext, batch: CheckinSyncBatch) {
    let applied = 0;
    for (const item of batch.items) {
      const at = new Date(item.at);
      if (Number.isNaN(at.getTime())) continue;
      const guest = await this.prisma.guest.findUnique({
        where: { id: item.guestId },
      });
      if (!guest || guest.invitationId !== staff.invitationId) continue;
      if (guest.checkedInAt) {
        if (guest.checkedInAt.getTime() > at.getTime()) {
          await this.prisma.guest.update({
            where: { id: guest.id },
            data: { checkedInAt: at, checkedInBy: staff.label },
          });
          applied += 1;
        }
        continue;
      }
      await this.prisma.guest.update({
        where: { id: guest.id },
        data: { checkedInAt: at, checkedInBy: staff.label },
      });
      applied += 1;
    }
    return { applied, total: batch.items.length };
  }

  async listStaff(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId);
    const rows = await this.prisma.staffAccess.findMany({
      where: { invitationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        expiresAt: true,
        revokedAt: true,
        lastSeenAt: true,
        createdAt: true,
      },
    });
    return rows;
  }

  async createStaff(
    invitationId: string,
    input: CreateStaffAccess,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const invitation = await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const expiresAt = invitation.eventDate
      ? new Date(invitation.eventDate.getTime() + 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = staffNano();
    const row = await this.prisma.staffAccess.create({
      data: {
        invitationId,
        token,
        label: input.label.trim(),
        expiresAt,
      },
    });
    const webBase =
      process.env.PUBLIC_WEB_URL?.replace(/\/$/, '') ?? 'http://localhost:4200';
    // Token returned once — owner must copy now.
    return {
      id: row.id,
      label: row.label,
      expiresAt: row.expiresAt,
      token,
      url: `${webBase}/checkin?s=${token}`,
    };
  }

  async revokeStaff(
    invitationId: string,
    staffId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const row = await this.prisma.staffAccess.findUnique({
      where: { id: staffId },
    });
    if (!row || row.invitationId !== invitationId) {
      throw new NotFoundException('Không tìm thấy link nhân viên.');
    }
    await this.prisma.staffAccess.update({
      where: { id: staffId },
      data: { revokedAt: new Date() },
    });
    return { ok: true as const };
  }

  async ensurePassCodes(invitationId: string) {
    return ensurePassCodes(this.prisma, invitationId);
  }

  private async nextPassCode(
    invitationId: string,
    slug: string,
    eventDate: Date | null
  ) {
    const existing = await this.prisma.guest.count({
      where: { invitationId, passCode: { not: null } },
    });
    const year = (eventDate ?? new Date()).getFullYear();
    const prefix = passCodePrefix(slug);
    let seq = existing + 1;
    for (let i = 0; i < 50; i++) {
      const code = formatPassCode(prefix, year, seq);
      const clash = await this.prisma.guest.findUnique({
        where: { passCode: code },
      });
      if (!clash) return code;
      seq += 1;
    }
    throw new BadRequestException('Không tạo được mã vào cổng.');
  }

  private async uniqueGuestToken() {
    const nano = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);
    for (let i = 0; i < 8; i++) {
      const token = nano();
      const exists = await this.prisma.guest.findUnique({ where: { token } });
      if (!exists) return token;
    }
    throw new BadRequestException('Không tạo được token khách.');
  }

  private guestPayload(guest: {
    id: string;
    name: string;
    group: string | null;
    partySize: number;
    checkedInAt: Date | null;
    walkIn: boolean;
    table: { label: string } | null;
  }) {
    return {
      id: guest.id,
      name: guest.name,
      group: guest.group,
      partySize: guest.partySize,
      tableLabel: guest.table?.label ?? null,
      checkedInAt: guest.checkedInAt?.toISOString() ?? null,
      walkIn: guest.walkIn,
    };
  }
}
