/**
 * A static export has no dev-server proxy, so the SPA always calls the API by
 * absolute URL and the backend allows the origin through CORS. The value is
 * baked in at build time, which is why the Docker image takes it as a build arg.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ErrorBody {
  message?: string | string[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    // fetch rejects with a bare "Failed to fetch" for every network-level
    // problem, including a CORS block, which says nothing about what to check.
    const origin =
      typeof window === 'undefined' ? 'este origen' : window.location.origin;
    throw new ApiError(
      `No se pudo contactar la API en ${BASE_URL}. Verificá que esté corriendo y que ` +
        `CORS_ORIGIN la permita desde ${origin}.`,
      0,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ErrorBody | null;
    const message = Array.isArray(body?.message)
      ? body.message.join(', ')
      : (body?.message ?? response.statusText);
    throw new ApiError(message, response.status);
  }

  // 204 No Content has an empty body, so parsing it as JSON would throw.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }
  return 'Ocurrió un error inesperado';
}
