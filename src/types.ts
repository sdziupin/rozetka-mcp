export type JsonObject = Record<string, unknown>;

export interface Product {
  id: number;
  title?: string;
  url?: string;
  price?: number;
  old_price?: number;
  currency?: string;
  available?: boolean;
  sell_status?: string;
  seller_id?: number;
  merchant_id?: number;
  brand?: string;
  brand_id?: number;
  category_id?: number;
  category_name?: string;
  rating?: number;
  reviews?: number;
  discount?: number;
  image?: string;
  images?: string[];
  docket?: string;
  state?: string;
  groups?: unknown;
  raw?: JsonObject;
}

export type SearchSort = "relevance" | "price_asc" | "price_desc" | "newest";

export interface SearchSpec {
  query: string;
  page?: number;
  limit?: number;
  min_price?: number;
  max_price?: number;
  seller?: string;
  category_id?: number;
  sort?: SearchSort;
  filters?: Record<string, string | number | boolean | Array<string | number>>;
  hydrate?: boolean;
}
