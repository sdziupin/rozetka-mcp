const headers = {
  Referer: "https://rozetka.com.ua/",
  Accept: "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8",
  "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
};

const productId = 510920189;
const shortUrl = `https://rozetka.com.ua/ua/p${productId}/`;
const response = await fetch(shortUrl, { headers, redirect: "follow" });
const text = await response.text();

console.log(JSON.stringify({
  requested: shortUrl,
  final_url: response.url,
  status: response.status,
  content_type: response.headers.get("content-type"),
  body_sample: text.slice(0, 12000),
}, null, 2));

if (!response.ok) throw new Error(`Product page returned HTTP ${response.status}`);
if (!response.url.includes(`p${productId}`)) throw new Error("Product page did not resolve canonical product URL");
if (!text.includes(String(productId))) throw new Error("Product page HTML does not contain product id");
