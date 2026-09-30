const headers = {
  Referer: "https://rozetka.com.ua/",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "uk-UA,uk;q=0.9,en;q=0.8",
};

async function get(url: URL): Promise<{ status: number; text: string }> {
  const response = await fetch(url, { headers });
  return { status: response.status, text: await response.text() };
}

const productId = 510920189;
const probes = [
  new URL(`https://product-api.rozetka.com.ua/v4/goods/get-other-sellers?front-type=xl&country=UA&lang=ua&goodsId=${productId}`),
  new URL(`https://product-api.rozetka.com.ua/v4/comments/get?front-type=xl&country=UA&lang=ua&goods=${productId}&page=1&sort=date&type=comment&limit=1`),
];

for (const url of probes) {
  const result = await get(url);
  console.log(JSON.stringify({ url: String(url), status: result.status, body: result.text.slice(0, 12000) }, null, 2));
  if (result.status !== 200) throw new Error(`Probe failed: ${result.status} ${url}`);
}
