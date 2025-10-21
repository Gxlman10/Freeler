import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

export const formatCurrency = (amount: number, currency: string = 'PEN'): string => {
  const symbols: Record<string, string> = {
    PEN: 'S/',
    USD: '$',
    EUR: '€',
  };
  
  const symbol = symbols[currency] || currency;
  return `${symbol} ${amount.toFixed(2)}`;
};

export const formatDate = (date: string | Date, format: string = 'DD/MM/YYYY'): string => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).format('DD/MM/YYYY HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).fromNow();
};

export const formatDateForAPI = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatDateTimeForAPI = (date: Date | string): string => {
  return dayjs(date).format('YYYY-MM-DDTHH:mm:ss');
};
