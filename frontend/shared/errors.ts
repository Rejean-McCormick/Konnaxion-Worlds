// FILE: frontend/shared/errors.ts
export type ErrorState = { message: string; statusCode?: number };

export class HttpError extends Error {
  statusCode?: number;
  data?: unknown;
  cause?: unknown;
  constructor(message: string, opts?: { statusCode?: number; data?: unknown; cause?: unknown }) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = opts?.statusCode;
    this.data = opts?.data;
    if (opts?.cause !== undefined) this.cause = opts.cause;
  }
}

type AxiosLikeError = {
  isAxiosError: boolean;
  message: string;
  response?: { status?: number; data?: unknown };
};

function isAxiosError(e: unknown): e is AxiosLikeError {
  return !!e && typeof e === 'object' && 'isAxiosError' in e;
}

function getErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object' || !('message' in data)) return undefined;
  const message = (data as { message?: unknown }).message;
  return typeof message === 'string' ? message : undefined;
}

export function isHttpError(e: unknown): e is HttpError {
  return e instanceof HttpError;
}

export function normalizeError(e: unknown): ErrorState {
  if (isHttpError(e)) return { message: e.message, statusCode: e.statusCode };
  if (isAxiosError(e)) {
    const statusCode = e.response?.status;
    const message = getErrorMessage(e.response?.data) ?? e.message ?? 'Unexpected error';
    return { message, statusCode };
  }
  if (e instanceof Error) return { message: e.message };
  return { message: 'Unexpected error' };
}
