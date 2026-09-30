const headers = {
  Referer: "https://rozetka.com.ua/",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
};

async function fetchJson(url: URL): Promise<{ status: number; text: string; json?: unknown }> {
  const response = await fetch(url, { headers });
  const text = await response.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch {}
  return { status: response.status, text, json };
}

const search = new URL("https://search.rozetka.com.ua/ua/search/api/v6/");
search.searchParams.set("front-type", "xl");
search.searchParams.set("country", "UA");
search.searchParams.set("lang", "ua");
search.searchParams.set("text", "Asus Zenbook 14");
search.searchParams.set("page", "1");

const searchResult = await fetchJson(search);
if (searchResult.status !== 200) throw new Error(`Search HTTP ${searchResult.status}`);
const searchJson = searchResult.json as { data?: { goods?: Array<{ id?: number } | number> } };
const first = searchJson.data?.goods?.[0];
const productId = typeof first === "number" ? first : Number(first?.id);
if (!productId) throw new Error("Search returned no product id");

const endpoints = [
  { path: "get-main", param: "id" },
  { path: "get-additional-prices", param: "id" },
  { path: "get-characteristic", param: "goodsId" },
  { path: "get-goods-description", param: "goodsId" },
];

let ok = 0;
for (const endpoint of endpoints) {
  const url = new URL(`https://product-api.rozetka.com.ua/v4/goods/${endpoint.path}`);
  url.searchParams.set("country", "UA");
  url.searchParams.set("lang", "ua");
  url.searchParams.set(endpoint.param, String(productId));
  const result = await fetchJson(url);
  console.log(JSON.stringify({
    endpoint: endpoint.path,
    product_id: productId,
    status: result.status,
    body: result.text.slice(0, 8000),
  }, null, 2));
  if (result.status === 200) ok += 1;
}

if (ok !== endpoints.length) throw new Error(`Only ${ok}/${endpoints.length} public product endpoints passed`);
