/**
 * Web search tool for the MCP server.
 *
 * Provides search and URL content extraction capabilities
 * using injected search providers.
 */

import { z } from "zod";
import type { WebSearchProvider, SearchResult } from "../providers/provider.js";
import { Ok, type Result } from "../result.js";

// --- Schemas ---

export const SearchSchema = z.object({
  query: z.string().min(1).describe("Search query"),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(20)
    .optional()
    .default(5)
    .describe("Maximum number of results"),
});

export type SearchInput = z.infer<typeof SearchSchema>;

// --- Tool Implementation ---

export async function webSearch(
  input: SearchInput,
  provider: WebSearchProvider
): Promise<Result<SearchResult[]>> {
  return provider.search(input.query, input.maxResults);
}
