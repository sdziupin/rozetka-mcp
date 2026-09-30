const headers = {
  Referer: "https://rozetka.com.ua/",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
};

async function getText(url: URL): Promise<{ status: number; text: string }> {
  const response = await fetch(url, { headers });
  return { status: response.status, text: await response.text() };
}

const search = new URL("https://search.rozetka.com.ua/ua/search/api/v6/");
search.searchParams.set("front-type", "xl");
search.searchParams.set("country", "UA");
search.searchParams.set("lang", "ua");
search.searchParams.set("text", "Asus Zenbook 14");
search.searchParams.set("page", "1");

const searchResult = await getText(search);
if (searchResult.status !== 200) throw new Error(`Search HTTP ${searchResult.status}`);
const searchJson = JSON.parse(searchResult.text) as { data?: { goods?: Array<{ id?: number } | number> } };
const first = searchJson.data?.goods?.[0];
const productId = typeof first === "number" ? first : Number(first?.id);
if (!productId) throw new Error("Search returned no product id");

const probes = [
  "https://product-api.rozetka.com.ua/v4/goods/get-characteristic",
  "https://product-api.rozetka.com.ua/v4/goods/get-goods-description",
  "https://product-api.rozetka.com.ua/v4/marketing/get-super-offer",
  "https://product-api.rozetka.com.ua/v4/goods/get-related",
];

let publicProductApiCount = 0;
for (const endpoint of probes) {
  const url = new URL(endpoint);
  url.searchParams.set("country", "UA");
  url.searchParams.set("lang", "ua");
  url.searchParams.set("goodsId", String(productId));
  const result = await getText(url);
  console.log(JSON.stringify({
    endpoint,
    product_id: productId,
    status: result.status,
    body: result.text.slice(0, 5000),
  }, null, 2));
  if (result.status === 200) publicProductApiCount += 1;
}

if (publicProductApiCount < 2) {
  throw new Error(`Too few public product-api endpoints passed: ${publicProductApiCount}`);
}
