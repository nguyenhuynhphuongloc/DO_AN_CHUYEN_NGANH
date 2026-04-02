export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  exp?: number;
  nbf?: number;
  iat?: number;
};
