import { MarkInvoicePaidSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class MarkInvoicePaidDto extends createZodDto(MarkInvoicePaidSchema) {}
