const headers = {
  Referer: "https://rozetka.com.ua/",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
};

const queries = [
  "Asus Zenbook 14",
  "Samsung Galaxy S25 Ultra",
  "Deye SE-F16-C",
];

let firstProductId: number | undefined;
for (const query of queries) {
  const url = new URL("https://search.rozetka.com.ua/ua/search/api/v6/");
  url.searchParams.set("front-type", "xl");
  url.searchParams.set("country", "UA");
  url.searchParams.set("lang", "ua");
  url.searchParams.set("text", query);
  url.searchParams.set("page", "1");

  const response = await fetch(url, { headers });
  const text = await response.text();
  console.log(JSON.stringify({ query, status: response.status, body: text.slice(0, 6000) }, null, 2));
  if (!response.ok) throw new Error(`Search API returned HTTP ${response.status} for ${query}`);

  const json = JSON.parse(text) as {
    data?: { goods?: Array<{ id?: number } | number>; ids?: number[] };
  };
  const goods = json.data?.goods ?? json.data?.ids ?? [];
  if (Array.isArray(goods) && goods.length > 0) {
    const first = goods[0];
    firstProductId = typeof first === "number" ? first : first?.id;
    if (firstProductId) break;
  }
}

if (!firstProductId) throw new Error("Search API smoke found no product ids");

const productApi = new URL("https://product-api.rozetka.com.ua/v4/goods/get-characteristic");
productApi.searchParams.set("country", "UA");
productApi.searchParams.set("lang", "ua");
productApi.searchParams.set("goodsId", String(firstProductId));

const productResponse = await fetch(productApi, { headers });
const productText = await productResponse.text();
console.log(JSON.stringify({
  product_id: firstProductId,
  product_api_status: productResponse.status,
  product_api_body: productText.slice(0, 4000),
}, null, 2));

if (!productResponse.ok) throw new Error(`Product API returned HTTP ${productResponse.status}`);
