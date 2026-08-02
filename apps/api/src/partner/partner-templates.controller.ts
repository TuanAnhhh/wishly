import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SavePartnerTemplateSchema } from '@wishly/contracts';
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

@Controller('partner/templates')
@UseInterceptors(ResponseEnvelopeInterceptor)
@UseFilters(HttpExceptionEnvelopeFilter)
@UseGuards(PartnerContextGuard, PartnerRoleGuard)
export class PartnerTemplatesController {
  constructor(private readonly partner: PartnerService) {}

  private ctx(c: PartnerContext | undefined): PartnerContext {
    if (!c) throw new ForbiddenException('Bạn chưa thuộc studio đối tác nào.');
    return c;
  }

  @Get()
  list(@CurrentPartner() ctx: PartnerContext | undefined) {
    return this.partner.listTemplates(this.ctx(ctx));
  }

  @Post()
  @PartnerRoles('admin', 'edit')
  save(
    @CurrentPartner() ctx: PartnerContext | undefined,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(SavePartnerTemplateSchema)) body: unknown
  ) {
    return this.partner.saveTemplate(this.ctx(ctx), body as never, user);
  }

  @Delete(':templateId')
  @PartnerRoles('admin')
  remove(
    @CurrentPartner() ctx: PartnerContext | undefined,
    @Param('templateId') templateId: string
  ) {
    return this.partner.deleteTemplate(this.ctx(ctx), templateId);
  }
}
