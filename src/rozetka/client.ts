import type { Config } from "../config.js";
import { requestJson } from "../http.js";
import type { JsonObject, Product, SearchSpec, SearchSort } from "../types.js";
import { categoryIdFromUrl, extractIds, extractProducts, extractSearchData, normalizeProduct, productId } from "./normalize.js";

interface ClientOptions {
  fetchImpl?: typeof fetch;
}

function object(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : undefined;
}

function array(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function sortValue(sort: SearchSort | undefined): string | undefined {
  switch (sort) {
    case "price_asc": return "cheap";
    case "price_desc": return "expensive";
    case "newest": return "novelty";
    default: return undefined;
  }
}

function appendFilters(params: URLSearchParams, filters: SearchSpec["filters"]): void {
  if (!filters) return;
  for (const [key, value] of Object.entries(filters)) {
    if (!key || value === undefined || value === null) continue;
    if (Array.isArray(value)) params.set(key, value.map(String).join(","));
    else params.set(key, String(value));
  }
}

export class RozetkaClient {
  constructor(
    private readonly config: Config,
    private readonly options: ClientOptions = {},
  ) {}

  private headers(): HeadersInit {
    return {
      "User-Agent": this.config.userAgent,
      "Accept-Language": `${this.config.language},uk;q=0.9,ru;q=0.7,en;q=0.5`,
      Referer: `https://rozetka.com.ua/${this.config.language}/`,
    };
  }

  private async get<T>(url: URL | string): Promise<T> {
    return requestJson<T>(String(url), {
      timeoutMs: this.config.httpTimeoutMs,
      retries: this.config.httpRetries,
      fetchImpl: this.options.fetchImpl,
      headers: this.headers(),
    });
  }

  private commonParams(): URLSearchParams {
    return new URLSearchParams({
      "front-type": this.config.frontType,
      country: this.config.country,
      lang: this.config.language,
    });
  }

  async search(spec: SearchSpec): Promise<JsonObject> {
    const query = spec.query?.trim();
    if (!query) throw new Error("query must not be empty");
    const page = Math.max(1, Math.floor(spec.page ?? 1));
    const limit = Math.max(1, Math.min(60, Math.floor(spec.limit ?? 20)));

    const params = this.commonParams();
    params.set("text", query);
    params.set("page", String(page));
    if (spec.seller) params.set("seller", spec.seller);
    if (spec.category_id) params.set("category_id", String(spec.category_id));
    const sort = sortValue(spec.sort);
    if (sort) params.set("sort", sort);
    appendFilters(params, spec.filters);

    const raw = await this.get<unknown>(`${this.config.searchApiBase}/?${params}`);
    const data = extractSearchData(raw);
    let products = extractProducts(raw);
    const rawIds = extractIds(raw);
    const ids = rawIds.length ? rawIds : products.map((product) => product.id);

    if (spec.hydrate !== false && ids.length) {
      try {
        const hydrated = await this.getProducts(ids.slice(0, Math.max(limit, 1)));
        if (hydrated.length) products = hydrated;
      } catch {
        // Search results remain usable even when the detail endpoint changes or is unavailable.
      }
    }

    if (spec.min_price !== undefined) products = products.filter((p) => p.price !== undefined && p.price >= spec.min_price!);
    if (spec.max_price !== undefined) products = products.filter((p) => p.price !== undefined && p.price <= spec.max_price!);
    products = products.slice(0, limit);

    const pagination = object(data.pagination);
    const total = numberValue(data.total ?? data.count ?? pagination?.total ?? pagination?.total_count ?? pagination?.items_count);

    return {
      query,
      page,
      returned: products.length,
      total: total ?? null,
      products,
      pagination: pagination ?? null,
      navigate_to: object(object(data.meta)?.navigateTo)?.url ?? null,
    };
  }

  async getProducts(ids: Array<number | string>): Promise<Product[]> {
    const unique = [...new Set(ids.map(productId).filter((id): id is number => Boolean(id)))];
    if (!unique.length) return [];
    if (unique.length > 60) throw new Error("At most 60 product ids can be hydrated in one call");

    const params = this.commonParams();
    params.set("product_ids", unique.join(","));
    params.set("with_groups", "1");
    params.set("with_docket", "1");
    params.set("with_extra_info", "1");
    params.set("goods_group_href", "1");

    const raw = await this.get<unknown>(`${this.config.catalogApiBase}/goods/getDetails?${params}`);
    const root = object(raw);
    const payload = root?.data ?? raw;
    const payloadObject = object(payload);
    const candidates = Array.isArray(payload)
      ? payload
      : array(payloadObject?.goods ?? payloadObject?.products ?? payloadObject?.items);
    return candidates.map((item) => normalizeProduct(item)).filter((item): item is Product => Boolean(item));
  }

  async getProduct(idOrUrl: number | string, options: { description?: boolean; characteristics?: boolean; raw?: boolean } = {}): Promise<JsonObject> {
    const id = productId(idOrUrl);
    if (!id) throw new Error(`Cannot resolve Rozetka product id from: ${idOrUrl}`);
    const [product] = await this.getProducts([id]);
    if (!product) throw new Error(`Product not found: ${id}`);

    const result: JsonObject = { product };
    if (options.description) {
      try {
        const params = this.commonParams();
        params.set("goodsId", String(id));
        result.description = extractSearchData(await this.get(`${this.config.productApiBase}/goods/get-goods-description?${params}`));
      } catch (error) {
        result.description_error = error instanceof Error ? error.message : String(error);
      }
    }
    if (options.characteristics) {
      try {
        const params = this.commonParams();
        params.set("goodsId", String(id));
        result.characteristics = extractSearchData(await this.get(`${this.config.productApiBase}/goods/get-characteristic?${params}`));
      } catch (error) {
        result.characteristics_error = error instanceof Error ? error.message : String(error);
      }
    }
    return result;
  }

  async listFilters(query: string, categoryId?: number): Promise<JsonObject> {
    const params = this.commonParams();
    params.set("text", query.trim());
    params.set("page", "1");
    if (categoryId) params.set("category_id", String(categoryId));
    const data = extractSearchData(await this.get(`${this.config.searchApiBase}/?${params}`));
    return {
      query,
      category_id: categoryId ?? null,
      filters: data.filters ?? [],
      options: data.options ?? [],
      chosen: data.chosen ?? [],
      related_options: data.related_options ?? null,
      categories: data.categories ?? null,
    };
  }

  async listCategories(query?: string, limit = 100): Promise<JsonObject> {
    const params = this.commonParams();
    const raw = await this.get<unknown>(`${this.config.commonApiBase}/v2/fat-menu/full?${params}`);
    const data = extractSearchData(raw);
    const flattened: Array<{ id: number; title?: string; url?: string; parent_id?: number }> = [];
    const seen = new Set<number>();

    const walk = (value: unknown, parentId?: number): void => {
      if (Array.isArray(value)) {
        for (const item of value) walk(item, parentId);
        return;
      }
      const node = object(value);
      if (!node) return;
      const id = productId(node.category_id ?? node.id);
      const title = typeof node.title === "string" ? node.title : typeof node.name === "string" ? node.name : undefined;
      const url = typeof node.href === "string" ? node.href : typeof node.url === "string" ? node.url : undefined;
      const currentParent = numberValue(node.parent_id) ?? parentId;
      if (id && !seen.has(id)) {
        seen.add(id);
        flattened.push({ id, title, url, parent_id: currentParent });
      }
      const nextParent = id ?? parentId;
      for (const key of ["children", "items", "categories", "one", "two", "three", "four"]) {
        if (node[key] !== undefined) walk(node[key], nextParent);
      }
      for (const [key, child] of Object.entries(node)) {
        if (["children", "items", "categories", "one", "two", "three", "four"].includes(key)) continue;
        if (child && typeof child === "object") walk(child, nextParent);
      }
    };
    walk(data);

    const needle = query?.trim().toLowerCase();
    const matches = needle
      ? flattened.filter((item) => item.title?.toLowerCase().includes(needle) || String(item.id) === needle)
      : flattened;
    return { total: matches.length, returned: Math.min(matches.length, limit), categories: matches.slice(0, Math.max(1, Math.min(500, limit))) };
  }

  async searchCategory(categoryId: number, options: { page?: number; limit?: number; seller?: string; sort?: SearchSort } = {}): Promise<JsonObject> {
    if (!Number.isInteger(categoryId) || categoryId <= 0) throw new Error("category_id must be a positive integer");
    const page = Math.max(1, Math.floor(options.page ?? 1));
    const limit = Math.max(1, Math.min(60, Math.floor(options.limit ?? 20)));
    const params = this.commonParams();
    params.set("category_id", String(categoryId));
    params.set("page", String(page));
    if (options.seller) params.set("seller", options.seller);
    const sort = sortValue(options.sort);
    if (sort) params.set("sort", sort);

    const raw = await this.get<unknown>(`${this.config.catalogApiBase}/goods/get?${params}`);
    const data = extractSearchData(raw);
    const ids = extractIds(raw).slice(0, limit);
    const products = ids.length ? await this.getProducts(ids) : extractProducts(raw).slice(0, limit);
    return {
      category_id: categoryId,
      page,
      returned: products.length,
      total_pages: numberValue(data.total_pages) ?? null,
      total: numberValue(data.total ?? data.count) ?? null,
      products,
    };
  }

  resolveUrl(value: string): JsonObject {
    const product = productId(value);
    if (product) return { type: "product", id: product, url: value };
    const category = categoryIdFromUrl(value);
    if (category) return { type: "category", id: category, url: value };
    return { type: "unknown", id: null, url: value };
  }
}
