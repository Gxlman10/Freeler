import { registerAs } from '@nestjs/config';

const DEFAULT_BASE_URL = 'https://dniruc.apisperu.com/api/v1';
const DEFAULT_FALLBACK_URL = 'https://graphperu.daustinn.com/api/query';

export default registerAs('apiperu', () => ({
  token: process.env.APISPERU_TOKEN ?? 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImNvcmRvdmFmbG9yZXNlbHZpbkBnbWFpbC5jb20ifQ.ZXJ0YpDYC0YJlZw3bsaaUmDFztHTJWbyhS7F95fWFNw',
  baseUrl: process.env.APISPERU_BASE_URL ?? DEFAULT_BASE_URL,
  fallbackUrl: process.env.APISPERU_FALLBACK_URL ?? DEFAULT_FALLBACK_URL,
  enableFallback:
    process.env.APISPERU_ENABLE_FALLBACK === undefined
      ? true
      : process.env.APISPERU_ENABLE_FALLBACK !== 'false',
  timeout: Number(process.env.APISPERU_TIMEOUT ?? 5000),
}));

