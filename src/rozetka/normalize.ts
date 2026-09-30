import type { JsonObject, Product } from "../types.js";

function asObject(value: unknown): JsonObject | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : undefined;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const parsed = Number(value.replace(/\s+/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toStringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function boolAvailability(raw: JsonObject): boolean | undefined {
  const status = toStringValue(raw.sell_status ?? raw.status)?.toLowerCase();
  if (!status) return undefined;
  if (["available", "active", "in_stock", "instock"].includes(status)) return true;
  if (["unavailable", "out_of_stock", "inactive", "archive", "archived"].includes(status)) return false;
  return undefined;
}

function normalizeRating(raw: JsonObject): number | undefined {
  const commentsMark = toNumber(raw.comments_mark ?? raw.rating);
  if (commentsMark !== undefined) return commentsMark;
  const stars = raw.stars;
  if (typeof stars === "string" && stars.endsWith("%")) {
    const pct = Number.parseFloat(stars.slice(0, -1));
    if (Number.isFinite(pct)) return Math.round((pct / 20) * 100) / 100;
  }
  return undefined;
}

function imageList(raw: JsonObject): string[] | undefined {
  const images = asObject(raw.images);
  const all = images?.all_images;
  if (Array.isArray(all)) {
    const urls = all.filter((item): item is string => typeof item === "string");
    if (urls.length) return urls;
  }
  const direct = raw.images;
  if (Array.isArray(direct)) {
    const urls = direct.filter((item): item is string => typeof item === "string");
    if (urls.length) return urls;
  }
  return undefined;
}

export function productId(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) return value;
  if (typeof value === "string") {
    const plain = Number.parseInt(value, 10);
    if (/^\d+$/.test(value) && plain > 0) return plain;
    const match = value.match(/\/p(\d+)(?:\/|$|\?)/i);
    if (match) return Number.parseInt(match[1], 10);
  }
  const raw = asObject(value);
  if (raw) return productId(raw.id ?? raw.goods_id ?? raw.product_id);
  return undefined;
}

export function categoryIdFromUrl(value: string): number | undefined {
  const match = value.match(/\/c(\d+)(?:\/|$|\?|#)/i);
  return match ? Number.parseInt(match[1], 10) : undefined;
}

export function normalizeProduct(value: unknown, includeRaw = false): Product | undefined {
  const raw = asObject(value);
  if (!raw) return undefined;
  const id = productId(raw);
  if (!id) return undefined;

  const images = imageList(raw);
  const imageObject = asObject(raw.images);
  const image = toStringValue(raw.image_main ?? raw.image ?? raw.picture ?? imageObject?.main ?? imageObject?.preview);

  return {
    id,
    title: toStringValue(raw.title ?? raw.name ?? raw.goods_title),
    url: toStringValue(raw.href ?? raw.url ?? raw.product_url),
    price: toNumber(raw.price ?? raw.current_price ?? raw.price_pcs),
    old_price: toNumber(raw.old_price ?? raw.price_old),
    currency: toStringValue(raw.currency ?? raw.price_currency) ?? "UAH",
    available: boolAvailability(raw),
    sell_status: toStringValue(raw.sell_status ?? raw.status),
    seller_id: toNumber(raw.seller_id),
    merchant_id: toNumber(raw.merchant_id),
    brand: toStringValue(raw.brand ?? raw.producer_name),
    brand_id: toNumber(raw.brand_id ?? raw.producer_id),
    category_id: toNumber(raw.category_id ?? asObject(raw.category)?.id),
    category_name: toStringValue(raw.category_name ?? asObject(raw.category)?.title),
    rating: normalizeRating(raw),
    reviews: toNumber(raw.comments_amount ?? raw.reviews_count ?? raw.comments_count),
    discount: toNumber(raw.discount),
    image: image ?? images?.[0],
    images,
    docket: toStringValue(raw.docket ?? raw.description_short),
    state: toStringValue(raw.state),
    groups: raw.groups,
    ...(includeRaw ? { raw } : {}),
  };
}

export function extractSearchData(response: unknown): JsonObject {
  const root = asObject(response) ?? {};
  return asObject(root.data) ?? root;
}

export function extractProducts(response: unknown): Product[] {
  const data = extractSearchData(response);
  const candidates = data.goods ?? data.products ?? data.items ?? data.results;
  if (!Array.isArray(candidates)) return [];
  return candidates.map((item) => normalizeProduct(item)).filter((item): item is Product => Boolean(item));
}

export function extractIds(response: unknown): number[] {
  const data = extractSearchData(response);
  const ids = data.ids;
  if (Array.isArray(ids)) {
    return ids.map(productId).filter((id): id is number => Boolean(id));
  }
  const candidates = data.goods ?? data.products ?? data.items ?? data.results;
  if (Array.isArray(candidates)) {
    const resolved = candidates.map(productId).filter((id): id is number => Boolean(id));
    if (resolved.length) return resolved;
  }
  return extractProducts(response).map((product) => product.id);
}
