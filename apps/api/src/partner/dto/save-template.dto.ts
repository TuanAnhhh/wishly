import { SavePartnerTemplateSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class SavePartnerTemplateDto extends createZodDto(
  SavePartnerTemplateSchema
) {}
