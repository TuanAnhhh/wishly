import { InviteMemberSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class InviteMemberDto extends createZodDto(InviteMemberSchema) {}
