import { UpdatePartnerBrandSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class UpdatePartnerBrandDto extends createZodDto(
  UpdatePartnerBrandSchema
) {}
