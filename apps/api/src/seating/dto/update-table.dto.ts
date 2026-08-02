import { UpdateSeatingTableSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class UpdateSeatingTableDto extends createZodDto(
  UpdateSeatingTableSchema
) {}
