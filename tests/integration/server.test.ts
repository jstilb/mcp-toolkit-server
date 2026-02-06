import { createServer } from "../../src/server.js";
import { loadConfig } from "../../src/config.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";

describe("MCP Server Integration", () => {
  it("should create server without errors", () => {
    const config = loadConfig({ mode: "mock" });
    const server = createServer(config);
    expect(server).toBeDefined();
  });

  it("should create server with production config", () => {
    const config = loadConfig({ mode: "production" });
    const server = createServer(config);
    expect(server).toBeDefined();
  });
});

describe("MCP Server E2E via In-Memory Transport", () => {
  let client: Client;

  beforeAll(async () => {
    const config = loadConfig({ mode: "mock" });
    const server = createServer(config);
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);

    client = new Client({ name: "test-client", version: "0.1.0" });
    await client.connect(clientTransport);
  });

  it("should list tools", async () => {
    const result = await client.listTools();
    expect(result.tools.length).toBeGreaterThan(0);
    const toolNames = result.tools.map((t) => t.name);
    expect(toolNames).toContain("summarize");
    expect(toolNames).toContain("analyze_sentiment");
    expect(toolNames).toContain("extract_entities");
    expect(toolNames).toContain("web_search");
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
    const data = JSON.parse(textContent.text);
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
    const entities = JSON.parse(textContent.text);
    expect(entities.length).toBeGreaterThan(0);
  });

  it("should call web_search tool", async () => {
    const result = await client.callTool({
      name: "web_search",
      arguments: { query: "MCP protocol", maxResults: 3 },
    });
    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    const results = JSON.parse(textContent.text);
    expect(results.length).toBe(3);
  });

  it("should call get_weather tool", async () => {
    const result = await client.callTool({
      name: "get_weather",
      arguments: { location: "San Francisco" },
    });
    const textContent = (result.content as Array<{ type: string; text: string }>)[0]!;
    const weather = JSON.parse(textContent.text);
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
    const data = JSON.parse(text);
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
