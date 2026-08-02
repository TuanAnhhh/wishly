import { UpdatePrivacySchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class UpdatePrivacyDto extends createZodDto(UpdatePrivacySchema) {}
