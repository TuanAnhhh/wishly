import { CreatePartnerClientSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class CreatePartnerClientDto extends createZodDto(
  CreatePartnerClientSchema
) {}
