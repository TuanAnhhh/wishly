const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details?: unknown
  ) {
    super(message);
  }
}

type Envelope<T> =
  | { data: T }
  | { error: { code: string; message: string; details?: unknown } };

/**
 * Envelope-aware fetch wrapper for endpoints that opt into the
 * response-envelope convention (P07-P13 new endpoints only).
 * Existing P01-P06 endpoints keep using apps/*\/src/lib/api.ts.
 */
export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (res.status === 204) return undefined as T;

  const body = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!res.ok) {
    const error =
      body && 'error' in body
        ? body.error
        : { code: 'UNKNOWN', message: `Lỗi ${res.status}`, details: undefined };
    throw new ApiError(error.message, res.status, error.code, error.details);
  }

  if (body && 'data' in body) return body.data;
  return body as T;
}
