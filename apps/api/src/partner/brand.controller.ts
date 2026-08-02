import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UpdatePartnerBrandSchema } from '@wishly/contracts';
import { CurrentPartner } from '../auth/partner.decorator';
import { PartnerContextGuard } from '../auth/partner-context.guard';
import {
  PartnerRoleGuard,
  PartnerRoles,
} from '../auth/partner-role.guard';
import type { PartnerContext } from '../auth/partner.types';
import { HttpExceptionEnvelopeFilter } from '../common/http-exception-envelope.filter';
import { Public } from '../common/public.decorator';
import { ResponseEnvelopeInterceptor } from '../common/response-envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { PartnerService } from './partner.service';

@Controller()
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(HttpExceptionEnvelopeFilter)
export class BrandController {
  constructor(private readonly partner: PartnerService) {}

  @Public()
  @Get('public/brand/:subdomain')
  publicBrand(@Param('subdomain') subdomain: string) {
    return this.partner.publicBrandBySubdomain(subdomain);
  }

  @Get('partner/brand')
  @UseGuards(PartnerContextGuard, PartnerRoleGuard)
  getBrand(@CurrentPartner() ctx: PartnerContext | undefined) {
    if (!ctx) throw new ForbiddenException('Bạn chưa thuộc studio đối tác nào.');
    return this.partner.getBrand(ctx);
  }

  @Patch('partner/brand')
  @UseGuards(PartnerContextGuard, PartnerRoleGuard)
  @PartnerRoles('admin')
  updateBrand(
    @CurrentPartner() ctx: PartnerContext | undefined,
    @Body(new ZodValidationPipe(UpdatePartnerBrandSchema)) body: unknown
  ) {
    if (!ctx) throw new ForbiddenException('Bạn chưa thuộc studio đối tác nào.');
    return this.partner.updateBrand(ctx, body as never);
  }
}
