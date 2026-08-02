import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_TABLE_CAPACITY,
  type AssignGuest,
  type CreateSeatingTable,
  type TableKind,
  type UpdateSeatingTable,
} from '@wishly/contracts';
import type { AuthUser } from '../auth/auth.types';
import { InvitationsService } from '../invitations/invitations.service';
import { PrismaService } from '../prisma/prisma.service';

type SeatingLogEntry = {
  at: string;
  by: string;
  action: string;
};

@Injectable()
export class SeatingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invitations: InvitationsService
  ) {}

  async getSeating(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    const invitation = await this.invitations.assertCanAccess(
      invitationId,
      user,
      anonSessionId
    );
    const [tables, guests] = await Promise.all([
      this.prisma.seatingTable.findMany({
        where: { invitationId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.guest.findMany({
        where: { invitationId },
        orderBy: [{ group: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          group: true,
          partySize: true,
          partySizeManual: true,
          tableId: true,
          mealChoice: true,
          allergyNote: true,
        },
      }),
    ]);
    return {
      tables,
      guests,
      seatingLockedAt: invitation.seatingLockedAt,
      seatingLog: (invitation.seatingLog as SeatingLogEntry[] | null) ?? [],
      eventType: invitation.eventType,
    };
  }

  async createTable(
    invitationId: string,
    input: CreateSeatingTable,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const kind = (input.kind ?? 'round') as TableKind;
    const capacity = input.capacity ?? DEFAULT_TABLE_CAPACITY[kind];
    const count = await this.prisma.seatingTable.count({
      where: { invitationId },
    });
    const label =
      input.label?.trim() ||
      (kind === 'stage' ? 'Sân khấu' : `Bàn ${count + 1}`);

    const table = await this.prisma.seatingTable.create({
      data: {
        invitationId,
        label,
        kind,
        capacity,
        x: input.x ?? 80,
        y: input.y ?? 80,
      },
    });
    await this.appendLog(invitationId, user, `create:${table.id}:${label}`);
    return table;
  }

  async updateTable(
    invitationId: string,
    tableId: string,
    input: UpdateSeatingTable,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const table = await this.requireTable(invitationId, tableId);
    let capacity = input.capacity;
    if (input.kind && capacity === undefined) {
      capacity = DEFAULT_TABLE_CAPACITY[input.kind];
    }
    const updated = await this.prisma.seatingTable.update({
      where: { id: table.id },
      data: {
        ...(input.label !== undefined ? { label: input.label.trim() } : {}),
        ...(input.kind !== undefined ? { kind: input.kind } : {}),
        ...(capacity !== undefined ? { capacity } : {}),
        ...(input.x !== undefined ? { x: input.x } : {}),
        ...(input.y !== undefined ? { y: input.y } : {}),
      },
    });
    if (
      input.label !== undefined ||
      input.kind !== undefined ||
      input.capacity !== undefined
    ) {
      await this.appendLog(invitationId, user, `update:${tableId}`);
    }
    return updated;
  }

  async deleteTable(
    invitationId: string,
    tableId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    await this.requireTable(invitationId, tableId);
    await this.prisma.guest.updateMany({
      where: { invitationId, tableId },
      data: { tableId: null },
    });
    await this.prisma.seatingTable.delete({ where: { id: tableId } });
    await this.appendLog(invitationId, user, `delete:${tableId}`);
    return { ok: true as const };
  }

  async assignGuest(
    invitationId: string,
    input: AssignGuest,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const guest = await this.prisma.guest.findUnique({
      where: { id: input.guestId },
    });
    if (!guest || guest.invitationId !== invitationId) {
      throw new NotFoundException('Không tìm thấy khách.');
    }
    if (input.tableId) {
      await this.requireTable(invitationId, input.tableId);
    }
    const updated = await this.prisma.guest.update({
      where: { id: guest.id },
      data: { tableId: input.tableId },
      select: {
        id: true,
        name: true,
        group: true,
        partySize: true,
        partySizeManual: true,
        tableId: true,
      },
    });
    await this.appendLog(
      invitationId,
      user,
      `assign:${guest.id}:${input.tableId ?? 'null'}`
    );
    return updated;
  }

  async lock(
    invitationId: string,
    user: AuthUser | undefined,
    anonSessionId: string | undefined
  ) {
    await this.invitations.assertCanAccess(invitationId, user, anonSessionId, { write: true });
    const updated = await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { seatingLockedAt: new Date() },
      select: { seatingLockedAt: true },
    });
    await this.appendLog(invitationId, user, 'lock', true);
    return updated;
  }

  /** Sync partySize from RSVP when owner has not overridden manually. */
  async syncPartySizeFromRsvp(
    guestId: string | null | undefined,
    plusOnes: number
  ) {
    if (!guestId) return;
    const guest = await this.prisma.guest.findUnique({
      where: { id: guestId },
      select: { partySizeManual: true },
    });
    if (!guest || guest.partySizeManual) return;
    await this.prisma.guest.update({
      where: { id: guestId },
      data: { partySize: Math.max(1, 1 + plusOnes) },
    });
  }

  private async requireTable(invitationId: string, tableId: string) {
    const table = await this.prisma.seatingTable.findUnique({
      where: { id: tableId },
    });
    if (!table || table.invitationId !== invitationId) {
      throw new NotFoundException('Không tìm thấy bàn.');
    }
    return table;
  }

  private async appendLog(
    invitationId: string,
    user: AuthUser | undefined,
    action: string,
    force = false
  ) {
    const invitation = await this.prisma.invitation.findUnique({
      where: { id: invitationId },
      select: { seatingLockedAt: true, seatingLog: true },
    });
    if (!invitation) return;
    if (!force && !invitation.seatingLockedAt) return;
    const prev = (invitation.seatingLog as SeatingLogEntry[] | null) ?? [];
    const entry: SeatingLogEntry = {
      at: new Date().toISOString(),
      by: user?.id ?? 'anon',
      action,
    };
    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { seatingLog: [...prev, entry] },
    });
  }
}
