import { API_BASE_URL } from "./config";

type QueryValue = string | number | boolean | string[] | null | undefined;

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  /** Supabase access token, for /admin routes. */
  token?: string;
  signal?: AbortSignal;
  /** Next.js data cache settings; ignored in the browser. */
  next?: { revalidate?: number | false; tags?: string[] };
  cache?: RequestCache;
};

/** Validation problems as the API reports them in `error.details`. */
export type ApiFieldIssue = {
  location: "params" | "query" | "body";
  path: string;
  message: string;
};

/** Any failed call: HTTP errors carry the API's `{ error: { code, message } }`, network failures use status 0. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNotFound() {
    return this.status === 404;
  }

  /** Field-level validation issues, when the API sent them. */
  get fieldIssues(): ApiFieldIssue[] {
    return Array.isArray(this.details) ? (this.details as ApiFieldIssue[]) : [];
  }
}

function buildUrl(path: string, query: ApiRequestOptions["query"] = {}) {
  const url = new URL(`${API_BASE_URL}/api/v1${path}`);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    // Arrays become repeated keys (?brand=a&brand=b), which the API expects.
    for (const item of Array.isArray(value) ? value : [value]) {
      url.searchParams.append(key, String(item));
    }
  }

  return url;
}

async function readError(response: Response): Promise<ApiError> {
  const payload = (await response.json().catch(() => null)) as {
    error?: { code?: string; message?: string; details?: unknown };
  } | null;

  return new ApiError(
    response.status,
    payload?.error?.code ?? "http_error",
    payload?.error?.message ?? `Request failed with status ${response.status}`,
    payload?.error?.details
  );
}

/** The one place the frontend talks to the backend. Returns the parsed JSON body. */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
      cache: options.cache,
      next: options.next
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, "network_error", "Couldn't reach the server. Check your connection and try again.");
  }

  if (!response.ok) throw await readError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
