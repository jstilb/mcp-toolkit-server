/**
 * MCP Resources - expose data as named resources.
 *
 * Resources are read-only data endpoints that clients can
 * subscribe to. They're like GET endpoints in a REST API.
 */

import type { ServerConfig } from "../config.js";

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export function getResourceDefinitions(): ResourceDefinition[] {
  return [
    {
      uri: "toolkit://config",
      name: "Server Configuration",
      description: "Current server configuration and mode",
      mimeType: "application/json",
    },
    {
      uri: "toolkit://tools",
      name: "Available Tools",
      description: "List of all available tools with their schemas",
      mimeType: "application/json",
    },
    {
      uri: "toolkit://health",
      name: "Health Status",
      description: "Server health and readiness status",
      mimeType: "application/json",
    },
  ];
}

export function readResource(uri: string, config: ServerConfig): string {
  switch (uri) {
    case "toolkit://config":
      return JSON.stringify(
        {
          mode: config.mode,
          name: config.name,
          version: config.version,
          maxConcurrentTools: config.maxConcurrentTools,
          toolTimeoutMs: config.toolTimeoutMs,
        },
        null,
        2
      );

    case "toolkit://tools":
      return JSON.stringify(
        {
          tools: [
            {
              name: "summarize",
              description: "Summarize text to a specified length",
              category: "text-analysis",
            },
            {
              name: "analyze_sentiment",
              description: "Analyze sentiment of text",
              category: "text-analysis",
            },
            {
              name: "extract_entities",
              description: "Extract named entities from text",
              category: "text-analysis",
            },
            {
              name: "web_search",
              description: "Search the web for information",
              category: "web",
            },
            {
              name: "get_weather",
              description: "Get current weather for a location",
              category: "weather",
            },
          ],
          count: 5,
        },
        null,
        2
      );

    case "toolkit://health":
      return JSON.stringify(
        {
          status: "healthy",
          mode: config.mode,
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
        },
        null,
        2
      );

    default:
      return JSON.stringify({ error: `Unknown resource: ${uri}` });
  }
}
