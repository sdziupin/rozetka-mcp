export class HttpError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

function parseJsonOrText(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function retryable(error: unknown): boolean {
  if (error instanceof HttpError) return error.status === 429 || error.status >= 500;
  return error instanceof TypeError || (error instanceof Error && error.name === "AbortError");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  fetchImpl?: typeof fetch;
}

export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    timeoutMs = 15_000,
    retries = 2,
    fetchImpl = fetch,
    ...requestInit
  } = options;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        ...requestInit,
        signal: controller.signal,
        headers: {
          Accept: "application/json, text/plain, */*",
          ...requestInit.headers,
        },
      });
      const text = await response.text();
      if (!response.ok) {
        throw new HttpError(
          `HTTP ${response.status} ${response.statusText} for ${url}`,
          response.status,
          parseJsonOrText(text),
        );
      }
      return parseJsonOrText(text) as T;
    } catch (error) {
      lastError = error;
      if (attempt >= retries || !retryable(error)) break;
      await sleep(Math.min(250 * 2 ** attempt, 2_000));
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof Error && lastError.name === "AbortError") {
    throw new Error(`Request timed out after ${timeoutMs} ms: ${url}`);
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
