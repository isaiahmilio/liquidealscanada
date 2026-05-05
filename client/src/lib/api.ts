// Thin fetch wrapper. Uses Vite proxy in dev (/api → :4000), so relative URLs.
// Sends/receives session cookies via credentials: 'include'.

export class ApiError extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  let body: unknown = null;
  const text = await res.text();
  if (text) {
    try { body = JSON.parse(text); } catch { body = text; }
  }

  if (!res.ok) {
    const msg = (body && typeof body === 'object' && 'error' in body)
      ? String((body as { error: unknown }).error)
      : `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, body);
  }
  return body as T;
}

export const api = {
  get:    <T>(p: string)               => request<T>(p),
  post:   <T>(p: string, body?: unknown) => request<T>(p, { method: 'POST',   body: body instanceof FormData ? body : JSON.stringify(body ?? {}) }),
  patch:  <T>(p: string, body?: unknown) => request<T>(p, { method: 'PATCH',  body: JSON.stringify(body ?? {}) }),
  del:    <T>(p: string)                 => request<T>(p, { method: 'DELETE' }),
};
