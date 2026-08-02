import { AssignGuestSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class AssignGuestDto extends createZodDto(AssignGuestSchema) {}
