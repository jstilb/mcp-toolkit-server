/**
 * MCP Server implementation.
 *
 * Registers all tools, resources, and prompts with the
 * Model Context Protocol SDK. Supports mock mode for demos.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import type { ServerConfig } from "./config.js";
import { createProviders, type Providers } from "./providers/index.js";
import {
  summarize,
  analyzeSentiment,
  extractEntities,
  SummarizeSchema,
  SentimentSchema,
  EntitySchema,
} from "./tools/text-analysis.js";
import { webSearch, SearchSchema } from "./tools/web-search.js";
import { getWeather, WeatherSchema } from "./tools/weather.js";
import {
  getResourceDefinitions,
  readResource,
} from "./resources/index.js";
import {
  getPromptDefinitions,
  generatePromptMessages,
} from "./prompts/index.js";

export function createServer(config: ServerConfig): Server {
  const server = new Server(
    { name: config.name, version: config.version },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  const providers = createProviders(config);

  registerTools(server, providers);
  registerResources(server, config);
  registerPrompts(server);

  return server;
}

function registerTools(server: Server, providers: Providers): void {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "summarize",
        description:
          "Summarize text to a specified length. Useful for condensing long documents or articles.",
        inputSchema: {
          type: "object" as const,
          properties: {
            text: { type: "string", description: "Text to summarize" },
            maxLength: {
              type: "number",
              description: "Maximum summary length in words",
              default: 100,
            },
          },
          required: ["text"],
        },
      },
      {
        name: "analyze_sentiment",
        description:
          "Analyze the sentiment of text. Returns positive, negative, neutral, or mixed with confidence score.",
        inputSchema: {
          type: "object" as const,
          properties: {
            text: {
              type: "string",
              description: "Text to analyze sentiment of",
            },
          },
          required: ["text"],
        },
      },
      {
        name: "extract_entities",
        description:
          "Extract named entities (people, organizations, locations, dates, technologies) from text.",
        inputSchema: {
          type: "object" as const,
          properties: {
            text: {
              type: "string",
              description: "Text to extract entities from",
            },
            types: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "person",
                  "organization",
                  "location",
                  "date",
                  "technology",
                ],
              },
              description: "Entity types to extract",
              default: ["person", "organization", "location"],
            },
          },
          required: ["text"],
        },
      },
      {
        name: "web_search",
        description:
          "Search the web for information. Returns relevant results with titles, URLs, and snippets.",
        inputSchema: {
          type: "object" as const,
          properties: {
            query: { type: "string", description: "Search query" },
            maxResults: {
              type: "number",
              description: "Maximum number of results (1-20)",
              default: 5,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_weather",
        description:
          "Get current weather conditions and forecast for a location.",
        inputSchema: {
          type: "object" as const,
          properties: {
            location: {
              type: "string",
              description: "City or location name",
            },
            unit: {
              type: "string",
              enum: ["celsius", "fahrenheit"],
              description: "Temperature unit",
              default: "fahrenheit",
            },
          },
          required: ["location"],
        },
      },
    ],
  }));

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "summarize": {
        const input = SummarizeSchema.parse(args);
        const result = await summarize(input, providers.text);
        if (!result.ok) {
          return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return { content: [{ type: "text", text: result.value }] };
      }

      case "analyze_sentiment": {
        const input = SentimentSchema.parse(args);
        const result = await analyzeSentiment(input, providers.text);
        if (!result.ok) {
          return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }],
        };
      }

      case "extract_entities": {
        const input = EntitySchema.parse(args);
        const result = await extractEntities(input, providers.text);
        if (!result.ok) {
          return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }],
        };
      }

      case "web_search": {
        const input = SearchSchema.parse(args);
        const result = await webSearch(input, providers.search);
        if (!result.ok) {
          return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }],
        };
      }

      case "get_weather": {
        const input = WeatherSchema.parse(args);
        const result = await getWeather(input, providers.weather);
        if (!result.ok) {
          return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  });
}

function registerResources(server: Server, config: ServerConfig): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: getResourceDefinitions(),
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => ({
    contents: [
      {
        uri: request.params.uri,
        mimeType: "application/json",
        text: readResource(request.params.uri, config),
      },
    ],
  }));
}

function registerPrompts(server: Server): void {
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: getPromptDefinitions(),
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const messages = generatePromptMessages(
      request.params.name,
      (request.params.arguments ?? {}) as Record<string, string>
    );
    return {
      messages: messages.map((m) => ({
        role: m.role,
        content: { type: "text" as const, text: m.content },
      })),
    };
  });
}
