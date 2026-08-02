import { Module } from '@nestjs/common';
import { PartnerContextGuard } from '../auth/partner-context.guard';
import { PartnerRoleGuard } from '../auth/partner-role.guard';
import { BillingController } from './billing.controller';
import { BillingCron } from './billing.cron';
import { BillingService } from './billing.service';
import { BrandController } from './brand.controller';
import { MembersController } from './members.controller';
import { PartnerController } from './partner.controller';
import { PartnerService } from './partner.service';
import { PartnerTemplatesController } from './partner-templates.controller';

@Module({
  controllers: [
    PartnerController,
    BrandController,
    MembersController,
    PartnerTemplatesController,
    BillingController,
  ],
  providers: [
    PartnerService,
    BillingService,
    BillingCron,
    PartnerContextGuard,
    PartnerRoleGuard,
  ],
  exports: [PartnerService],
})
export class PartnerModule {}
