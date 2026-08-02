export type JwtPayload = {
  sub: string;
  email: string | null;
};

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatarUrl: string | null;
  provider: string;
};
