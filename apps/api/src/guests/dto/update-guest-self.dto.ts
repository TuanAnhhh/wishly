import { UpdateGuestSelfSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class UpdateGuestSelfDto extends createZodDto(UpdateGuestSelfSchema) {}
