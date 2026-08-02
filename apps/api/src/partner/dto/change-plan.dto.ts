import { ChangePartnerPlanSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class ChangePartnerPlanDto extends createZodDto(
  ChangePartnerPlanSchema
) {}
