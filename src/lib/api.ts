const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787/api";

export type ApiResult<T> = {
  ok: boolean;
  data: T | null;
  error: string | null;
};

export async function apiRequestResult<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers || {}) },
    });
    const body = (await response.json().catch(() => ({}))) as T & { error?: string };
    return {
      ok: response.ok,
      data: response.ok ? body : null,
      error: response.ok ? null : body.error || `Request failed with status ${response.status}`,
    };
  } catch {
    return { ok: false, data: null, error: "The server could not be reached" };
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T | null> {
  const result = await apiRequestResult<T>(path, init);
  return result.data;
}

export { API_URL };
