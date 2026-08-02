import { UpdateMemberRoleSchema } from '@wishly/contracts';
import { createZodDto } from '../../common/zod-dto';

export class UpdateMemberRoleDto extends createZodDto(UpdateMemberRoleSchema) {}
