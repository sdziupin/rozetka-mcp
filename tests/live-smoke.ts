const headers = {
  Referer: "https://rozetka.com.ua/",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
};

async function searchRozetka(query: string) {
  const url = new URL("https://search.rozetka.com.ua/ua/search/api/v6/");
  url.searchParams.set("front-type", "xl");
  url.searchParams.set("country", "UA");
  url.searchParams.set("lang", "ua");
  url.searchParams.set("text", query);
  url.searchParams.set("page", "1");

  const response = await fetch(url, { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(`Search API returned HTTP ${response.status} for ${query}`);
  const json = JSON.parse(text) as {
    data?: {
      goods?: Array<Record<string, unknown> | number>;
      ids?: number[];
      meta?: { navigateTo?: { url?: string } };
    };
  };
  const goods = json.data?.goods ?? json.data?.ids ?? [];
  return { status: response.status, data: json.data, goods };
}

const initial = await searchRozetka("Asus Zenbook 14");
if (!Array.isArray(initial.goods) || initial.goods.length === 0) throw new Error("Search API returned zero goods");

const first = initial.goods[0];
const productId = typeof first === "number" ? first : Number(first.id);
if (!Number.isFinite(productId) || productId <= 0) throw new Error("Search result has no product id");

console.log(JSON.stringify({
  search_status: initial.status,
  product_id: productId,
  first_good: typeof first === "number" ? first : first,
}, null, 2));

const byId = await searchRozetka(String(productId));
console.log(JSON.stringify({
  id_search_status: byId.status,
  id_search_count: byId.goods.length,
  id_search_first: byId.goods[0] ?? null,
  id_search_navigate_to: byId.data?.meta?.navigateTo?.url ?? null,
}, null, 2));

const productApi = new URL("https://product-api.rozetka.com.ua/v4/goods/get-characteristic");
productApi.searchParams.set("country", "UA");
productApi.searchParams.set("lang", "ua");
productApi.searchParams.set("goodsId", String(productId));

const productResponse = await fetch(productApi, { headers });
const productText = await productResponse.text();
console.log(JSON.stringify({
  product_api_status: productResponse.status,
  product_api_sample: productText.slice(0, 1500),
}, null, 2));

if (!productResponse.ok) throw new Error(`Product API returned HTTP ${productResponse.status}`);
