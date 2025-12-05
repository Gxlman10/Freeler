import { registerAs } from '@nestjs/config';

const parseOrigins = (value?: string | null) => {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  swaggerPath: process.env.SWAGGER_PATH ?? '/api',
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
}));
