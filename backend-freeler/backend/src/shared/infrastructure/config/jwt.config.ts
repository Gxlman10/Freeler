import { registerAs } from '@nestjs/config';

const HOURS_PATTERN = /^\s*(\d+(?:\.\d+)?)\s*h\s*$/i;

const parseExpiresIn = (raw?: string | null) => {
  if (!raw) return '28800s'; // 8 horas por defecto
  const hoursMatch = raw.match(HOURS_PATTERN);
  if (hoursMatch) {
    const hours = Number(hoursMatch[1]);
    if (!Number.isNaN(hours)) {
      const seconds = Math.round(hours * 3600);
      return `${seconds}s`;
    }
  }
  return raw;
};

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'change-me',
  expiresIn: parseExpiresIn(process.env.JWT_EXPIRES_IN),
}));
