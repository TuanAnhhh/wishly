import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  InviteMemberSchema,
  UpdateMemberRoleSchema,
} from '@wishly/contracts';
import { CurrentPartner } from '../auth/partner.decorator';
import { PartnerContextGuard } from '../auth/partner-context.guard';
import {
  PartnerRoleGuard,
  PartnerRoles,
} from '../auth/partner-role.guard';
import type { PartnerContext } from '../auth/partner.types';
import { HttpExceptionEnvelopeFilter } from '../common/http-exception-envelope.filter';
import { ResponseEnvelopeInterceptor } from '../common/response-envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PartnerService } from './partner.service';

@Controller('partner/members')
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(HttpExceptionEnvelopeFilter)
@UseGuards(PartnerContextGuard, PartnerRoleGuard)
export class MembersController {
  constructor(private readonly partner: PartnerService) {}

  private ctx(c: PartnerContext | undefined): PartnerContext {
    if (!c) throw new ForbiddenException('Bạn chưa thuộc studio đối tác nào.');
    return c;
  }

  @Get()
  list(@CurrentPartner() ctx: PartnerContext | undefined) {
    return this.partner.listMembers(this.ctx(ctx));
  }

  @Post()
  @PartnerRoles('admin')
  invite(
    @CurrentPartner() ctx: PartnerContext | undefined,
    @Body(new ZodValidationPipe(InviteMemberSchema)) body: unknown
  ) {
    return this.partner.inviteMember(this.ctx(ctx), body as never);
  }

  @Patch(':memberId')
  @PartnerRoles('admin')
  updateRole(
    @CurrentPartner() ctx: PartnerContext | undefined,
    @Param('memberId') memberId: string,
    @Body(new ZodValidationPipe(UpdateMemberRoleSchema)) body: unknown
  ) {
    return this.partner.updateMemberRole(
      this.ctx(ctx),
      memberId,
      body as never
    );
  }

  @Delete(':memberId')
  @PartnerRoles('admin')
  remove(
    @CurrentPartner() ctx: PartnerContext | undefined,
    @Param('memberId') memberId: string
  ) {
    return this.partner.removeMember(this.ctx(ctx), memberId);
  }
}
