/**
 * Unit tests for smart_summarize sampling tool.
 *
 * ISC 2 (3708): smart_summarize sends sampling/createMessage to client.
 */

import { smartSummarize } from "../../src/tools/sampling.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";

function makeMockServer(response: unknown): Server {
  return {
    createMessage: jest.fn().mockResolvedValue(response),
  } as unknown as Server;
}

describe("smartSummarize (ISC 2 — sampling/createMessage)", () => {
  it("calls server.createMessage with correct messages", async () => {
    const mockResponse = {
      role: "assistant",
      content: { type: "text", text: "AI safety summary." },
      model: "claude-test",
      stopReason: "endTurn",
    };
    const server = makeMockServer(mockResponse);

    const result = await smartSummarize(
      { text: "Anthropic builds AI safely.", maxLength: 50 },
      server
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe("AI safety summary.");
    }
    expect((server.createMessage as jest.Mock)).toHaveBeenCalledTimes(1);
    const call = (server.createMessage as jest.Mock).mock.calls[0]![0] as {
      messages: Array<{ role: string; content: { text: string } }>;
      maxTokens: number;
    };
    expect(call.messages[0]!.role).toBe("user");
    expect(call.messages[0]!.content.text).toContain("Anthropic builds AI safely.");
    expect(call.maxTokens).toBeGreaterThan(0);
  });

  it("returns error when sampling fails", async () => {
    const server = {
      createMessage: jest.fn().mockRejectedValue(new Error("Client does not support sampling")),
    } as unknown as Server;

    const result = await smartSummarize(
      { text: "Some text.", maxLength: 50 },
      server
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Sampling request failed");
    }
  });

  it("returns error when client returns non-text content type", async () => {
    const mockResponse = {
      role: "assistant",
      content: { type: "image", data: "base64data", mimeType: "image/png" },
      model: "claude-test",
      stopReason: "endTurn",
    };
    const server = makeMockServer(mockResponse);

    const result = await smartSummarize(
      { text: "Text here.", maxLength: 50 },
      server
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("non-text");
    }
  });

  it("uses custom maxLength in createMessage call", async () => {
    const server = makeMockServer({
      role: "assistant",
      content: { type: "text", text: "Short summary." },
      model: "claude-test",
      stopReason: "endTurn",
    });

    await smartSummarize({ text: "Long text.", maxLength: 25 }, server);

    const call = (server.createMessage as jest.Mock).mock.calls[0]![0] as {
      maxTokens: number;
    };
    // maxTokens should be maxLength * 4 = 100
    expect(call.maxTokens).toBe(100);
  });
});
