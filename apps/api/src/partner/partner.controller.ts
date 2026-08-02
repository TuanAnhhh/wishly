import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  CreatePartnerClientSchema,
  RegisterPartnerSchema,
  AcceptInviteSchema,
} from '@wishly/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUser } from '../auth/auth.types';
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

function requirePartner(ctx: PartnerContext | undefined): PartnerContext {
  if (!ctx) {
    throw new ForbiddenException('Bạn chưa thuộc studio đối tác nào.');
  }
  return ctx;
}

@Controller('partner')
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(HttpExceptionEnvelopeFilter)
@UseGuards(PartnerContextGuard, PartnerRoleGuard)
export class PartnerController {
  constructor(private readonly partner: PartnerService) {}

  @Post('register')
  register(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(RegisterPartnerSchema)) body: unknown
  ) {
    return this.partner.register(user, body as never);
  }

  @Post('accept-invite')
  acceptInvite(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(AcceptInviteSchema)) body: unknown
  ) {
    return this.partner.acceptInvite(user, (body as { token: string }).token);
  }

  @Get('me')
  me(
    @CurrentUser() user: AuthUser,
    @CurrentPartner() ctx: PartnerContext | undefined
  ) {
    return this.partner.me(user, ctx);
  }

  @Get('dashboard')
  dashboard(@CurrentPartner() ctx: PartnerContext | undefined) {
    return this.partner.dashboard(requirePartner(ctx));
  }

  @Get('clients')
  clients(
    @CurrentPartner() ctx: PartnerContext | undefined,
    @Query('status') status?: string,
    @Query('q') q?: string
  ) {
    return this.partner.listClients(requirePartner(ctx), { status, q });
  }

  @Post('clients')
  @PartnerRoles('admin', 'edit')
  createClient(
    @CurrentPartner() ctx: PartnerContext | undefined,
    @Body(new ZodValidationPipe(CreatePartnerClientSchema)) body: unknown
  ) {
    return this.partner.createClient(requirePartner(ctx), body as never);
  }
}
