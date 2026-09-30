import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Config } from "./config.js";
import { RozetkaClient } from "./rozetka/client.js";
import { SavedSearchStore } from "./saved-searches.js";
import type { JsonObject, SearchSpec, SearchSort } from "./types.js";

const stores = new WeakMap<Config, SavedSearchStore>();

function storeFor(config: Config): SavedSearchStore {
  let store = stores.get(config);
  if (!store) {
    store = new SavedSearchStore(config.savedSearchesFile);
    stores.set(config, store);
  }
  return store;
}

function ok(value: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] };
}

function fail(error: unknown): CallToolResult {
  return { content: [{ type: "text", text: error instanceof Error ? error.message : String(error) }], isError: true };
}

function argsObject(args: unknown): JsonObject {
  if (args == null) return {};
  if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Tool arguments must be an object");
  return args as JsonObject;
}

function required<T>(args: JsonObject, key: string): T {
  const value = args[key];
  if (value === undefined || value === null || value === "") throw new Error(`Missing required argument: ${key}`);
  return value as T;
}

function searchSpec(value: unknown): SearchSpec {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("search must be an object");
  const spec = value as SearchSpec;
  if (!spec.query?.trim()) throw new Error("search.query is required");
  return spec;
}

export async function handleTool(config: Config, name: string, rawArgs: unknown): Promise<CallToolResult> {
  try {
    const args = argsObject(rawArgs);
    const client = new RozetkaClient(config);
    const saved = storeFor(config);

    switch (name) {
      case "rozetka_search_products": return ok(await client.search(searchSpec(args)));
      case "rozetka_get_product": return ok(await client.getProduct(required<number | string>(args, "id_or_url"), {
        description: Boolean(args.include_description), characteristics: Boolean(args.include_characteristics),
      }));
      case "rozetka_get_products": return ok(await client.getProducts(required<Array<number | string>>(args, "ids")));
      case "rozetka_list_filters": return ok(await client.listFilters(required<string>(args, "query"), args.category_id as number | undefined));
      case "rozetka_list_categories": return ok(await client.listCategories(args.query as string | undefined, (args.limit as number | undefined) ?? 100));
      case "rozetka_search_category": return ok(await client.searchCategory(required<number>(args, "category_id"), {
        page: args.page as number | undefined, limit: args.limit as number | undefined, seller: args.seller as string | undefined, sort: args.sort as SearchSort | undefined,
      }));
      case "rozetka_resolve_url": return ok(client.resolveUrl(required<string>(args, "url")));
      case "rozetka_saved_search_list": return ok(await saved.list());
      case "rozetka_saved_search_create": return ok(await saved.create(required<string>(args, "name"), searchSpec(required(args, "search"))));
      case "rozetka_saved_search_run": {
        const item = await saved.get(required<string>(args, "id"));
        return ok({ saved_search: item, result: await client.search(item.search) });
      }
      case "rozetka_saved_search_delete": return ok(await saved.remove(required<string>(args, "id")));
      default: throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return fail(error);
  }
}
