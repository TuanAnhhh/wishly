import type { PartnerRole } from '@wishly/contracts';

export type PartnerContext = {
  partnerId: string;
  memberId: string;
  role: PartnerRole;
  partnerStatus: string;
  slotLimit: number;
};
