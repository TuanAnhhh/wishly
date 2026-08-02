import { DeleteEventSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class DeleteEventDto extends createZodDto(DeleteEventSchema) {}
