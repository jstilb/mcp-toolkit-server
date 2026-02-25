/**
 * MCP Protocol Integration Tests
 *
 * Uses @modelcontextprotocol/sdk Client class for in-process transport.
 * No HTTP mocking — direct in-process connection via InMemoryTransport.
 *
 * ISC coverage:
 * - ISC 1 (3600): sampling declared in capabilities
 * - ISC 2 (3708): smart_summarize tool (sampling/createMessage)
 * - ISC 3 (5184): configure_analysis tool (elicitation)
 * - ISC 5 (7736): tool annotations (readOnlyHint, idempotentHint, destructiveHint, openWorldHint)
 * - ISC 6 (8224): outputSchema on text analysis tools
 * - ISC 7 (2872): SDK Client in-process transport
 * - ISC 8 (2591): prompts/list, prompts/get, prompts capability
 * - ISC 11 (4312): ≥3 tools across domains
 */

import { createServer } from "../../src/server.js";
import { loadConfig } from "../../src/config.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  CreateMessageRequestSchema,
  ElicitRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// ---- Helpers ----

async function makeClient(options?: { sampling?: boolean; elicitation?: boolean }) {
  const config = loadConfig({ mode: "mock" });
  const server = createServer(config);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

  await server.connect(serverTransport);

  const clientCapabilities: Record<string, unknown> = {};
  if (options?.sampling) {
    clientCapabilities["sampling"] = {};
  }
  if (options?.elicitation) {
    clientCapabilities["elicitation"] = { form: {} };
  }

  const client = new Client(
    { name: "test-client", version: "0.1.0" },
    { capabilities: clientCapabilities }
  );
  await client.connect(clientTransport);

  return { client, server };
}

// ---- ISC 7 (2872): SDK Client in-process transport ----

describe("ISC 7 (2872): MCP SDK Client — in-process transport", () => {
  it("connects via InMemoryTransport and completes handshake", async () => {
    const { client } = await makeClient();
    // If connect() succeeded without throwing, handshake completed.
    // Verify we can call tools/list which requires a live connection.
    const result = await client.listTools();
    expect(result.tools).toBeDefined();
    expect(Array.isArray(result.tools)).toBe(true);
    expect(result.tools.length).toBeGreaterThan(0);
  });
});

// ---- ISC 1 (3600): sampling in capabilities ----

describe("ISC 1 (3600): Server sampling capability", () => {
  it("declares sampling in experimental capabilities during initialize handshake", async () => {
    const { client } = await makeClient();
    // The server advertises experimental.sampling — verify tools/list works
    // (the SDK handshake will have exchanged capabilities).
    // We inspect via getServerCapabilities if available.
    const serverCapabilities = client.getServerCapabilities();
    expect(serverCapabilities).toBeDefined();
    // sampling is declared under experimental per SDK 1.12 type constraints
    expect(serverCapabilities?.experimental).toBeDefined();
    expect(serverCapabilities?.experimental?.["sampling"]).toBeDefined();
  });
});

// ---- ISC 5 (7736): Tool annotations ----

describe("ISC 5 (7736): Tool annotations — readOnlyHint, idempotentHint, destructiveHint, openWorldHint", () => {
  let client: Client;

  beforeAll(async () => {
    const conn = await makeClient();
    client = conn.client;
  });

  it("all tools include annotations with required boolean fields", async () => {
    const result = await client.listTools();
    expect(result.tools.length).toBeGreaterThan(0);

    for (const tool of result.tools) {
      const annotations = tool.annotations as Record<string, unknown> | undefined;
      expect(annotations).toBeDefined();

      expect(typeof annotations?.["readOnlyHint"]).toBe("boolean");
      expect(typeof annotations?.["idempotentHint"]).toBe("boolean");
      expect(typeof annotations?.["destructiveHint"]).toBe("boolean");
      expect(typeof annotations?.["openWorldHint"]).toBe("boolean");
    }
  });

  it("brave_web_search has openWorldHint=true and readOnlyHint=true", async () => {
    const result = await client.listTools();
    const searchTool = result.tools.find((t) => t.name === "brave_web_search");
    expect(searchTool).toBeDefined();
    const annotations = searchTool?.annotations as Record<string, unknown>;
    expect(annotations?.["openWorldHint"]).toBe(true);
    expect(annotations?.["readOnlyHint"]).toBe(true);
  });

  it("analyze_sentiment has readOnlyHint=true and destructiveHint=false", async () => {
    const result = await client.listTools();
    const tool = result.tools.find((t) => t.name === "analyze_sentiment");
    expect(tool).toBeDefined();
    const annotations = tool?.annotations as Record<string, unknown>;
    expect(annotations?.["readOnlyHint"]).toBe(true);
    expect(annotations?.["destructiveHint"]).toBe(false);
  });
});

// ---- ISC 6 (8224): outputSchema on text analysis tools ----

describe("ISC 6 (8224): outputSchema on text analysis tools", () => {
  let client: Client;

  beforeAll(async () => {
    const conn = await makeClient();
    client = conn.client;
  });

  it("analyze_sentiment includes outputSchema with type=object and named properties", async () => {
    const result = await client.listTools();
    const tool = result.tools.find((t) => t.name === "analyze_sentiment");
    expect(tool).toBeDefined();
    const outputSchema = tool?.outputSchema as Record<string, unknown> | undefined;
    expect(outputSchema).toBeDefined();
    expect(outputSchema?.["type"]).toBe("object");
    const properties = outputSchema?.["properties"] as Record<string, unknown>;
    expect(properties).toBeDefined();
    expect(Object.keys(properties).length).toBeGreaterThan(0);
    expect(properties["sentiment"]).toBeDefined();
    expect(properties["confidence"]).toBeDefined();
  });

  it("extract_entities includes outputSchema with type=object", async () => {
    const result = await client.listTools();
    const tool = result.tools.find((t) => t.name === "extract_entities");
    expect(tool).toBeDefined();
    const outputSchema = tool?.outputSchema as Record<string, unknown> | undefined;
    expect(outputSchema).toBeDefined();
    expect(outputSchema?.["type"]).toBe("object");
    const properties = outputSchema?.["properties"] as Record<string, unknown>;
    expect(properties).toBeDefined();
    expect(properties["entities"]).toBeDefined();
  });

  it("summarize includes outputSchema with type=object", async () => {
    const result = await client.listTools();
    const tool = result.tools.find((t) => t.name === "summarize");
    expect(tool).toBeDefined();
    const outputSchema = tool?.outputSchema as Record<string, unknown> | undefined;
    expect(outputSchema).toBeDefined();
    expect(outputSchema?.["type"]).toBe("object");
    const properties = outputSchema?.["properties"] as Record<string, unknown>;
    expect(properties).toBeDefined();
    expect(properties["summary"]).toBeDefined();
  });
});

// ---- ISC 8 (2591): prompts/list, prompts/get, prompts capability ----

describe("ISC 8 (2591): prompts/list and prompts/get", () => {
  let client: Client;

  beforeAll(async () => {
    const conn = await makeClient();
    client = conn.client;
  });

  it("server declares prompts capability in initialize response", () => {
    const caps = client.getServerCapabilities();
    expect(caps?.prompts).toBeDefined();
  });

  it("prompts/list returns at least one prompt entry", async () => {
    const result = await client.listPrompts();
    expect(result.prompts.length).toBeGreaterThan(0);
    const promptNames = result.prompts.map((p) => p.name);
    expect(promptNames).toContain("research_topic");
  });

  it("prompts/get returns valid prompt with non-empty messages array", async () => {
    const result = await client.getPrompt({
      name: "research_topic",
      arguments: { topic: "AI safety" },
    });
    expect(Array.isArray(result.messages)).toBe(true);
    expect(result.messages.length).toBeGreaterThan(0);
    const firstMessage = result.messages[0]!;
    expect(firstMessage.role).toBe("user");
    const content = firstMessage.content as { type: string; text: string };
    expect(content.type).toBe("text");
    expect(content.text.length).toBeGreaterThan(0);
  });

  it("prompts/get for analyze_text returns messages with analysis instructions", async () => {
    const result = await client.getPrompt({
      name: "analyze_text",
      arguments: { text: "Hello world" },
    });
    expect(result.messages.length).toBeGreaterThan(0);
    const content = result.messages[0]!.content as { text: string };
    expect(content.text).toContain("analyze");
  });
});

// ---- ISC 11 (4312): ≥3 tools across domains ----

describe("ISC 11 (4312): ≥3 distinct tools across domains", () => {
  it("tools/list returns ≥3 tools covering search, weather, and analysis domains", async () => {
    const { client } = await makeClient();
    const result = await client.listTools();
    const toolNames = result.tools.map((t) => t.name);

    expect(result.tools.length).toBeGreaterThanOrEqual(3);

    // Unique names
    const uniqueNames = new Set(toolNames);
    expect(uniqueNames.size).toBe(toolNames.length);

    // Domain coverage: search, weather, text analysis
    expect(toolNames).toContain("brave_web_search");
    expect(toolNames).toContain("get_weather");
    expect(
      toolNames.some((n) =>
        ["summarize", "analyze_sentiment", "extract_entities"].includes(n)
      )
    ).toBe(true);
  });
});

// ---- ISC 2 (3708): smart_summarize — sampling/createMessage ----

describe("ISC 2 (3708): smart_summarize tool — sampling/createMessage", () => {
  it("smart_summarize is listed in tools/list", async () => {
    const { client } = await makeClient();
    const result = await client.listTools();
    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain("smart_summarize");
  });

  it("smart_summarize fails gracefully when client does not support sampling", async () => {
    // Without sampling capability, the tool should return an error result
    // (not throw at the transport level)
    const { client } = await makeClient({ sampling: false });
    const result = await client.callTool({
      name: "smart_summarize",
      arguments: { text: "Anthropic builds safe AI.", maxLength: 20 },
    });
    // Either returns error or succeeds — but does not throw
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
  });

  it("smart_summarize calls sampling/createMessage and returns client LLM response", async () => {
    const { client } = await makeClient({ sampling: true });

    // Set up the client to handle sampling requests
    let samplingCalled = false;
    client.setRequestHandler(
      CreateMessageRequestSchema,
      async () => {
        samplingCalled = true;
        return {
          role: "assistant" as const,
          content: { type: "text" as const, text: "AI builds safe systems." },
          model: "claude-test",
          stopReason: "endTurn",
        };
      }
    );

    const result = await client.callTool({
      name: "smart_summarize",
      arguments: { text: "Anthropic builds safe AI systems.", maxLength: 20 },
    });

    expect(samplingCalled).toBe(true);
    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    expect(textContent.text).toBe("AI builds safe systems.");
  });
});

// ---- ISC 3 (5184): configure_analysis — elicitation ----

describe("ISC 3 (5184): configure_analysis tool — elicitation/create", () => {
  it("configure_analysis is listed in tools/list", async () => {
    const { client } = await makeClient();
    const result = await client.listTools();
    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain("configure_analysis");
  });

  it("configure_analysis falls back gracefully when client does not support elicitation", async () => {
    const { client } = await makeClient({ elicitation: false });
    const result = await client.callTool({
      name: "configure_analysis",
      arguments: { text: "Some text to configure analysis for." },
    });
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    const data = JSON.parse(textContent.text) as { action: string; message: string };
    expect(data.action).toBe("accept");
    expect(data.message).toContain("default");
  });

  it("configure_analysis handles accept action with user-provided config", async () => {
    const { client } = await makeClient({ elicitation: true });

    client.setRequestHandler(
      ElicitRequestSchema,
      async () => ({
        action: "accept" as const,
        content: {
          depth: "deep",
          includeSentiment: true,
          includeEntities: false,
          maxSummaryWords: 200,
        },
      })
    );

    const result = await client.callTool({
      name: "configure_analysis",
      arguments: { text: "Configure this text analysis." },
    });

    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    const data = JSON.parse(textContent.text) as { action: string; config: { depth: string } };
    expect(data.action).toBe("accept");
    expect(data.config).toBeDefined();
    expect(data.config.depth).toBe("deep");
  });

  it("configure_analysis handles decline action with graceful fallback", async () => {
    const { client } = await makeClient({ elicitation: true });

    client.setRequestHandler(
      ElicitRequestSchema,
      async () => ({
        action: "decline" as const,
      })
    );

    const result = await client.callTool({
      name: "configure_analysis",
      arguments: { text: "Some text." },
    });

    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    const data = JSON.parse(textContent.text) as { action: string; message: string };
    expect(data.action).toBe("decline");
    expect(data.message.length).toBeGreaterThan(0);
    // No throw — graceful fallback
    expect(result.isError).toBeFalsy();
  });

  it("configure_analysis handles cancel action without throwing", async () => {
    const { client } = await makeClient({ elicitation: true });

    client.setRequestHandler(
      ElicitRequestSchema,
      async () => ({
        action: "cancel" as const,
      })
    );

    const result = await client.callTool({
      name: "configure_analysis",
      arguments: { text: "Some text." },
    });

    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    const data = JSON.parse(textContent.text) as { action: string };
    expect(data.action).toBe("cancel");
    expect(result.isError).toBeFalsy();
  });
});

// ---- Full tool call coverage (pre-existing) ----

describe("MCP Server E2E via In-Memory Transport", () => {
  let client: Client;

  beforeAll(async () => {
    const conn = await makeClient();
    client = conn.client;
  });

  it("should list tools", async () => {
    const result = await client.listTools();
    expect(result.tools.length).toBeGreaterThan(0);
    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain("summarize");
    expect(toolNames).toContain("analyze_sentiment");
    expect(toolNames).toContain("extract_entities");
    expect(toolNames).toContain("brave_web_search");
    expect(toolNames).toContain("get_weather");
  });

  it("should call summarize tool", async () => {
    const result = await client.callTool({
      name: "summarize",
      arguments: { text: "A long document about AI.", maxLength: 50 },
    });
    expect(result.content).toBeDefined();
    expect(Array.isArray(result.content)).toBe(true);
    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    expect(textContent.text.length).toBeGreaterThan(0);
  });

  it("should call analyze_sentiment tool", async () => {
    const result = await client.callTool({
      name: "analyze_sentiment",
      arguments: { text: "This is great and amazing!" },
    });
    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    const data = JSON.parse(textContent.text) as { sentiment: string };
    expect(data.sentiment).toBe("positive");
  });

  it("should call extract_entities tool", async () => {
    const result = await client.callTool({
      name: "extract_entities",
      arguments: {
        text: "Google is based in San Francisco.",
        types: ["organization", "location"],
      },
    });
    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    const entities = JSON.parse(textContent.text) as Array<{ text: string }>;
    expect(entities.length).toBeGreaterThan(0);
  });

  it("should call brave_web_search tool", async () => {
    const result = await client.callTool({
      name: "brave_web_search",
      arguments: { query: "MCP protocol", maxResults: 3 },
    });
    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    const results = JSON.parse(textContent.text) as Array<{ title: string }>;
    expect(results.length).toBe(3);
  });

  it("should call get_weather tool", async () => {
    const result = await client.callTool({
      name: "get_weather",
      arguments: { location: "San Francisco" },
    });
    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    const weather = JSON.parse(textContent.text) as { temperature: number };
    expect(weather.temperature).toBe(62);
  });

  it("should handle unknown tool", async () => {
    const result = await client.callTool({
      name: "nonexistent_tool",
      arguments: {},
    });
    expect(result.isError).toBe(true);
  });

  it("should list resources", async () => {
    const result = await client.listResources();
    expect(result.resources.length).toBeGreaterThan(0);
  });

  it("should read config resource", async () => {
    const result = await client.readResource({ uri: "toolkit://config" });
    const text = (result.contents[0] as { text: string }).text;
    const data = JSON.parse(text) as { mode: string };
    expect(data.mode).toBe("mock");
  });

  it("should list prompts", async () => {
    const result = await client.listPrompts();
    expect(result.prompts.length).toBeGreaterThan(0);
  });

  it("should get prompt messages", async () => {
    const result = await client.getPrompt({
      name: "research_topic",
      arguments: { topic: "AI safety" },
    });
    expect(result.messages.length).toBe(1);
  });
});
