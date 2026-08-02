import { CreateSeatingTableSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class CreateSeatingTableDto extends createZodDto(
  CreateSeatingTableSchema
) {}
