import { homedir } from "node:os";
import { join } from "node:path";

export interface Config {
  language: string;
  country: string;
  frontType: string;
  httpTimeoutMs: number;
  httpRetries: number;
  userAgent: string;
  searchApiBase: string;
  catalogApiBase: string;
  commonApiBase: string;
  productApiBase: string;
  savedSearchesFile: string;
}

function positiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const language = env.ROZETKA_LANGUAGE?.trim() || "ua";
  const dataDir = env.ROZETKA_DATA_DIR?.trim() || join(homedir(), ".rozetka-mcp");
  return {
    language,
    country: env.ROZETKA_COUNTRY?.trim() || "UA",
    frontType: env.ROZETKA_FRONT_TYPE?.trim() || "xl",
    httpTimeoutMs: positiveInteger(env.ROZETKA_HTTP_TIMEOUT_MS, 15_000),
    httpRetries: positiveInteger(env.ROZETKA_HTTP_RETRIES, 2),
    userAgent: env.ROZETKA_USER_AGENT?.trim() || "rozetka-mcp/0.1 (+https://github.com/sdziupin/rozetka-mcp)",
    searchApiBase: trimTrailingSlash(env.ROZETKA_SEARCH_API_BASE?.trim() || `https://search.rozetka.com.ua/${language}/search/api/v6`),
    catalogApiBase: trimTrailingSlash(env.ROZETKA_CATALOG_API_BASE?.trim() || "https://xl-catalog-api.rozetka.com.ua/v4"),
    commonApiBase: trimTrailingSlash(env.ROZETKA_COMMON_API_BASE?.trim() || "https://common-api.rozetka.com.ua"),
    productApiBase: trimTrailingSlash(env.ROZETKA_PRODUCT_API_BASE?.trim() || "https://product-api.rozetka.com.ua/v4"),
    savedSearchesFile: env.ROZETKA_SAVED_SEARCHES_FILE?.trim() || join(dataDir, "saved-searches.json"),
  };
}
