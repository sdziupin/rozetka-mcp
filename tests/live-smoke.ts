import { Impit } from "impit";

const http = new Impit({ browser: "chrome" });
const headers = {
  Referer: "https://rozetka.com.ua/",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
};

const categoryUrl = "https://rozetka.com.ua/ua/mobile-phones/c80003/producer=apple/";
const probes = [
  "https://xl-catalog-api.rozetka.com.ua/v4/goods/get?front-type=xl&country=UA&lang=ua&category_id=80003&page=1&producer=apple",
  "https://common-api.rozetka.com.ua/v1/api/pages/catalog/category?country=UA&lang=ua&url=" + encodeURIComponent(categoryUrl),
  "https://common-api.rozetka.com.ua/v2/fat-menu/full?country=UA&lang=ua&front-type=xl",
];

let usable = false;
for (const url of probes) {
  const response = await http.fetch(url, { headers });
  const text = await response.text();
  console.log(JSON.stringify({ url, status: response.status, body: text.slice(0, 1200) }, null, 2));
  if (url.includes("/pages/catalog/category") && response.status === 200 && text.includes('"data"')) usable = true;
}

if (!usable) throw new Error("Modern common-api catalog probe was not usable");
