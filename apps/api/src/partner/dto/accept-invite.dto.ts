import { AcceptInviteSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class AcceptInviteDto extends createZodDto(AcceptInviteSchema) {}
