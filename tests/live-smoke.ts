import { Impit } from "impit";

const impit = new Impit({ browser: "chrome" });
const headers = {
  Referer: "https://rozetka.com.ua/",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
};

const search = new URL("https://search.rozetka.com.ua/ua/search/api/v6/");
search.searchParams.set("front-type", "xl");
search.searchParams.set("country", "UA");
search.searchParams.set("lang", "ua");
search.searchParams.set("text", "iphone");
search.searchParams.set("page", "1");

const searchResponse = await impit.fetch(search.toString(), { headers });
const searchText = await searchResponse.text();
if (!searchResponse.ok) throw new Error(`Search API returned HTTP ${searchResponse.status}: ${searchText.slice(0, 500)}`);
const searchJson = JSON.parse(searchText) as {
  data?: { meta?: { navigateTo?: { url?: string } } };
};
const navigateTo = searchJson.data?.meta?.navigateTo?.url;
if (!navigateTo) throw new Error("Search API did not return navigateTo for iphone");

const category = new URL("https://common-api.rozetka.com.ua/v1/api/pages/catalog/category");
category.searchParams.set("country", "UA");
category.searchParams.set("lang", "ua");
category.searchParams.set("url", navigateTo);

const categoryResponse = await impit.fetch(category.toString(), { headers });
const categoryText = await categoryResponse.text();
console.log(JSON.stringify({
  search_status: searchResponse.status,
  navigate_to: navigateTo,
  category_status: categoryResponse.status,
  category_body: categoryText.slice(0, 20000),
}, null, 2));

if (!categoryResponse.ok) {
  throw new Error(`Catalog page API returned HTTP ${categoryResponse.status}`);
}
const categoryJson = JSON.parse(categoryText) as { data?: unknown };
if (!categoryJson.data) throw new Error("Catalog page API returned no data");
