/**
 * MCP Server implementation.
 *
 * Registers all tools, resources, and prompts with the
 * Model Context Protocol SDK. Supports mock mode for demos.
 *
 * 2025 MCP spec features:
 * - sampling capability (smart_summarize sends sampling/createMessage to client)
 * - elicitation capability (configure_analysis uses elicitation/create)
 * - tool annotations (readOnlyHint, idempotentHint, destructiveHint, openWorldHint)
 * - outputSchema on text analysis tools
 * - prompts capability
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
  smartSummarize,
  SmartSummarizeSchema,
} from "./tools/sampling.js";
import {
  configureAnalysis,
  ConfigureAnalysisSchema,
} from "./tools/elicitation.js";
import {
  getResourceDefinitions,
  readResource,
} from "./resources/index.js";
import {
  getPromptDefinitions,
  generatePromptMessages,
} from "./prompts/index.js";

// --- Tool Annotations (2025 MCP spec) ---

interface ToolAnnotations {
  readOnlyHint: boolean;
  idempotentHint: boolean;
  destructiveHint: boolean;
  openWorldHint: boolean;
}

// --- OutputSchema for text analysis tools ---

const SENTIMENT_OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    sentiment: {
      type: "string",
      enum: ["positive", "negative", "neutral", "mixed"],
      description: "Overall sentiment classification",
    },
    confidence: {
      type: "number",
      description: "Confidence score between 0 and 1",
    },
    explanation: {
      type: "string",
      description: "Human-readable explanation of the sentiment",
    },
  },
  required: ["sentiment", "confidence", "explanation"],
};

const ENTITIES_OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    entities: {
      type: "array",
      items: {
        type: "object",
        properties: {
          text: { type: "string", description: "The entity text" },
          type: { type: "string", description: "Entity type (person, organization, etc.)" },
          confidence: { type: "number", description: "Confidence score" },
        },
        required: ["text", "type", "confidence"],
      },
    },
  },
  required: ["entities"],
};

const SUMMARIZE_OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    summary: {
      type: "string",
      description: "The condensed summary of the input text",
    },
  },
  required: ["summary"],
};

export function createServer(config: ServerConfig): Server {
  const server = new Server(
    { name: config.name, version: config.version },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        // sampling declared via experimental per SDK 1.12 type constraints.
        // Signals that this server issues sampling/createMessage requests to clients.
        experimental: {
          sampling: {},
        },
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
  // List available tools with 2025-spec annotations and outputSchema
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
        outputSchema: SUMMARIZE_OUTPUT_SCHEMA,
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          destructiveHint: false,
          openWorldHint: false,
        } satisfies ToolAnnotations,
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
        outputSchema: SENTIMENT_OUTPUT_SCHEMA,
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          destructiveHint: false,
          openWorldHint: false,
        } satisfies ToolAnnotations,
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
        outputSchema: ENTITIES_OUTPUT_SCHEMA,
        annotations: {
          readOnlyHint: true,
          idempotentHint: true,
          destructiveHint: false,
          openWorldHint: false,
        } satisfies ToolAnnotations,
      },
      {
        name: "brave_web_search",
        description:
          "Search the web for information using Brave Search. Returns relevant results with titles, URLs, and snippets. Uses real Brave API in production mode.",
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
        annotations: {
          readOnlyHint: true,
          idempotentHint: false,
          destructiveHint: false,
          openWorldHint: true,
        } satisfies ToolAnnotations,
      },
      {
        name: "get_weather",
        description:
          "Get current weather conditions and forecast for a location. Uses OpenWeatherMap API in production mode.",
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
        annotations: {
          readOnlyHint: true,
          idempotentHint: false,
          destructiveHint: false,
          openWorldHint: true,
        } satisfies ToolAnnotations,
      },
      {
        name: "smart_summarize",
        description:
          "Summarize text by sending a sampling/createMessage request to the connected MCP client (Claude). The client's LLM generates the actual summary — demonstrating bidirectional MCP communication.",
        inputSchema: {
          type: "object" as const,
          properties: {
            text: {
              type: "string",
              description: "Text to summarize using the client's LLM",
            },
            maxLength: {
              type: "number",
              description: "Approximate maximum summary length in words",
              default: 150,
            },
          },
          required: ["text"],
        },
        annotations: {
          readOnlyHint: true,
          idempotentHint: false,
          destructiveHint: false,
          openWorldHint: false,
        } satisfies ToolAnnotations,
      },
      {
        name: "configure_analysis",
        description:
          "Configure analysis options via elicitation/create. Asks the user structured follow-up questions about analysis depth, and handles accept, decline, and cancel responses gracefully.",
        inputSchema: {
          type: "object" as const,
          properties: {
            text: {
              type: "string",
              description: "Text to analyze — triggers configuration dialog",
            },
          },
          required: ["text"],
        },
        annotations: {
          readOnlyHint: false,
          idempotentHint: false,
          destructiveHint: false,
          openWorldHint: false,
        } satisfies ToolAnnotations,
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
        // outputSchema requires structuredContent to be returned alongside content
        return {
          content: [{ type: "text", text: result.value }],
          structuredContent: { summary: result.value },
        };
      }

      case "analyze_sentiment": {
        const input = SentimentSchema.parse(args);
        const result = await analyzeSentiment(input, providers.text);
        if (!result.ok) {
          return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        // outputSchema requires structuredContent to be returned alongside content
        return {
          content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }],
          structuredContent: result.value,
        };
      }

      case "extract_entities": {
        const input = EntitySchema.parse(args);
        const result = await extractEntities(input, providers.text);
        if (!result.ok) {
          return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        // outputSchema requires structuredContent to be returned alongside content
        return {
          content: [{ type: "text", text: JSON.stringify(result.value, null, 2) }],
          structuredContent: { entities: result.value },
        };
      }

      case "brave_web_search": {
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

      case "smart_summarize": {
        const input = SmartSummarizeSchema.parse(args);
        const result = await smartSummarize(input, server);
        if (!result.ok) {
          return { content: [{ type: "text", text: `Error: ${result.error}` }], isError: true };
        }
        return { content: [{ type: "text", text: result.value }] };
      }

      case "configure_analysis": {
        const input = ConfigureAnalysisSchema.parse(args);
        const result = await configureAnalysis(input, server);
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
