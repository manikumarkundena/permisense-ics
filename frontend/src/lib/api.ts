const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store"
  });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    let detail = body || response.statusText;
    try {
      const parsed = JSON.parse(body);
      detail = typeof parsed?.detail === "string" ? parsed.detail : parsed?.detail ? JSON.stringify(parsed.detail) : detail;
    } catch {
      // Preserve non-JSON upstream errors as returned.
    }
    throw new Error(`API ${response.status}: ${detail}`);
  }
  return response.json() as Promise<T>;
}

export const apiBase = API_BASE;
