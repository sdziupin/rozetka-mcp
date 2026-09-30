const url = new URL("https://search.rozetka.com.ua/ua/search/api/v6/");
url.searchParams.set("front-type", "xl");
url.searchParams.set("country", "UA");
url.searchParams.set("lang", "ua");
url.searchParams.set("text", "iphone");
url.searchParams.set("section_id", "80003");
url.searchParams.set("producer", "apple");
url.searchParams.set("page", "1");

const response = await fetch(url, {
  headers: {
    Referer: "https://rozetka.com.ua/",
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
  },
});
const text = await response.text();
console.log(JSON.stringify({ status: response.status, url: String(url), body: text.slice(0, 8000) }, null, 2));

if (!response.ok) throw new Error(`Search API returned HTTP ${response.status}`);
const json = JSON.parse(text) as { data?: { goods?: unknown[]; ids?: unknown[] } };
const goods = json.data?.goods ?? json.data?.ids ?? [];
if (!Array.isArray(goods) || goods.length === 0) {
  throw new Error("Search API section_id probe returned zero goods");
}
