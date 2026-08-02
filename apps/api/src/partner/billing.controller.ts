import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ChangePartnerPlanSchema,
  MarkInvoicePaidSchema,
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
import { BillingService } from './billing.service';

@Controller('partner/billing')
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(HttpExceptionEnvelopeFilter)
@UseGuards(PartnerContextGuard, PartnerRoleGuard)
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  private ctx(c: PartnerContext | undefined): PartnerContext {
    if (!c) throw new ForbiddenException('Bạn chưa thuộc studio đối tác nào.');
    return c;
  }

  @Get()
  @PartnerRoles('admin')
  get(@CurrentPartner() ctx: PartnerContext | undefined) {
    return this.billing.getBilling(this.ctx(ctx));
  }

  @Post('change-plan')
  @PartnerRoles('admin')
  changePlan(
    @CurrentPartner() ctx: PartnerContext | undefined,
    @Body(new ZodValidationPipe(ChangePartnerPlanSchema)) body: unknown
  ) {
    return this.billing.changePlan(this.ctx(ctx), body as never);
  }

  @Post('mark-paid')
  @PartnerRoles('admin')
  markPaid(
    @CurrentPartner() ctx: PartnerContext | undefined,
    @Body(new ZodValidationPipe(MarkInvoicePaidSchema)) body: unknown
  ) {
    return this.billing.markInvoicePaid(
      this.ctx(ctx),
      (body as { invoiceId: string }).invoiceId
    );
  }
}
