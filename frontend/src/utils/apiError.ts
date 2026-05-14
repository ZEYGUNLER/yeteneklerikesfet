import { isAxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isAxiosError(error)) return fallback;

  const data = error.response?.data as unknown;
  if (typeof data === 'string' && data.trim()) return data;
  if (data && typeof data === 'object') {
    const maybeMessage = (data as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) return maybeMessage;
    if (Array.isArray(maybeMessage) && maybeMessage.length > 0) {
      const first = maybeMessage[0];
      if (typeof first === 'string' && first.trim()) return first;
    }
  }

  if (error.response?.status === 401) return 'Invalid email or password';
  return fallback;
}

