export interface ApiRequestOptions extends RequestInit {
  baseUrl?: string;
}

export class ApiRequestError extends Error {
  constructor(public readonly status: number, public readonly code?: string, message = `API request failed: ${status}`) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const apiRequest = async <T>(path: string, options: ApiRequestOptions = {}): Promise<T> => {
  const { baseUrl = '', headers, ...rest } = options;
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  });

  if (!response.ok) {
    let code: string | undefined;
    try {
      const body = await response.clone().json() as { code?: unknown; error?: { code?: unknown } };
      const candidate = body.code ?? body.error?.code;
      if (typeof candidate === 'string') code = candidate;
    } catch {
      // Keep the status error when the server does not return JSON.
    }
    throw new ApiRequestError(response.status, code);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};
