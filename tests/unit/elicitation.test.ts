/**
 * Unit tests for configure_analysis elicitation tool.
 *
 * ISC 3 (5184): configure_analysis triggers elicitation/create with JSON schema,
 * handles accept/decline/cancel response actions gracefully.
 */

import { configureAnalysis } from "../../src/tools/elicitation.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

function makeMockServer(elicitResult: unknown): Server {
  return {
    elicitInput: jest.fn().mockResolvedValue(elicitResult),
  } as unknown as Server;
}

function makeMockServerThrows(error: Error): Server {
  return {
    elicitInput: jest.fn().mockRejectedValue(error),
  } as unknown as Server;
}

describe("configureAnalysis (ISC 3 — elicitation/create)", () => {
  it("calls server.elicitInput with message and requestedSchema", async () => {
    const server = makeMockServer({
      action: "accept",
      content: {
        depth: "standard",
        includeSentiment: true,
        includeEntities: true,
        maxSummaryWords: 100,
      },
    });

    await configureAnalysis({ text: "Test text." }, server);

    expect((server.elicitInput as jest.Mock)).toHaveBeenCalledTimes(1);
    const call = (server.elicitInput as jest.Mock).mock.calls[0]![0] as {
      message: string;
      requestedSchema: { type: string; properties: Record<string, unknown> };
    };
    expect(call.message.length).toBeGreaterThan(0);
    expect(call.requestedSchema.type).toBe("object");
    expect(Object.keys(call.requestedSchema.properties)).toContain("depth");
    expect(Object.keys(call.requestedSchema.properties)).toContain("includeSentiment");
    expect(Object.keys(call.requestedSchema.properties)).toContain("includeEntities");
    expect(Object.keys(call.requestedSchema.properties)).toContain("maxSummaryWords");
  });

  it("returns action=accept with parsed config when user accepts", async () => {
    const server = makeMockServer({
      action: "accept",
      content: {
        depth: "deep",
        includeSentiment: false,
        includeEntities: true,
        maxSummaryWords: 200,
      },
    });

    const result = await configureAnalysis({ text: "Text here." }, server);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.action).toBe("accept");
      expect(result.value.config).toBeDefined();
      expect(result.value.config!.depth).toBe("deep");
      expect(result.value.config!.includeSentiment).toBe(false);
      expect(result.value.config!.includeEntities).toBe(true);
      expect(result.value.config!.maxSummaryWords).toBe(200);
    }
  });

  it("returns action=decline with message when user declines — does not throw", async () => {
    const server = makeMockServer({ action: "decline" });

    const result = await configureAnalysis({ text: "Text." }, server);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.action).toBe("decline");
      expect(result.value.message.length).toBeGreaterThan(0);
      expect(result.value.config).toBeUndefined();
    }
  });

  it("returns action=cancel with message when user cancels — does not throw", async () => {
    const server = makeMockServer({ action: "cancel" });

    const result = await configureAnalysis({ text: "Text." }, server);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.action).toBe("cancel");
      expect(result.value.message.length).toBeGreaterThan(0);
      expect(result.value.config).toBeUndefined();
    }
  });

  it("falls back to defaults when elicitation is not supported", async () => {
    const server = makeMockServerThrows(new Error("Client does not support elicitation"));

    const result = await configureAnalysis({ text: "Text." }, server);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.action).toBe("accept");
      expect(result.value.config).toBeDefined();
      expect(result.value.config!.depth).toBe("standard");
      expect(result.value.message).toContain("default");
    }
  });

  it("includes the text length in the elicitation message", async () => {
    const server = makeMockServer({ action: "cancel" });
    const longText = "A".repeat(500);

    await configureAnalysis({ text: longText }, server);

    const call = (server.elicitInput as jest.Mock).mock.calls[0]![0] as { message: string };
    expect(call.message).toContain("500");
  });
});
