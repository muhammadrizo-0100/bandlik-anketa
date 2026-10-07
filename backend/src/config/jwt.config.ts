import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'super_secret_jwt_key_bantlik_2026',
  expiresIn: process.env.JWT_EXPIRATION || '1d',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_bantlik_2026',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));
