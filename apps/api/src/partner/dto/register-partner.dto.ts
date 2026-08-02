import { RegisterPartnerSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class RegisterPartnerDto extends createZodDto(RegisterPartnerSchema) {}
