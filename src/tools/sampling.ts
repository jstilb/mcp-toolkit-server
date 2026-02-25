/**
 * Sampling tool: smart_summarize
 *
 * Demonstrates MCP bidirectional communication by sending a
 * sampling/createMessage request back to the connected client.
 * The client (Claude) generates the actual summary using its LLM.
 */

import { z } from "zod";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Ok, Err, type Result } from "../result.js";

export const SmartSummarizeSchema = z.object({
  text: z.string().min(1).describe("Text to summarize using the client's LLM"),
  maxLength: z
    .number()
    .int()
    .positive()
    .optional()
    .default(150)
    .describe("Approximate maximum summary length in words"),
});

export type SmartSummarizeInput = z.infer<typeof SmartSummarizeSchema>;

export async function smartSummarize(
  input: SmartSummarizeInput,
  server: Server
): Promise<Result<string>> {
  try {
    const response = await server.createMessage({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Please summarize the following text in approximately ${input.maxLength} words or fewer. Be concise and capture the key points:\n\n${input.text}`,
          },
        },
      ],
      maxTokens: input.maxLength * 4,
      systemPrompt:
        "You are a helpful assistant that creates concise, accurate summaries.",
    });

    if (response.content.type === "text") {
      return Ok(response.content.text);
    }

    return Err("Client returned non-text sampling response");
  } catch (err) {
    return Err(`Sampling request failed: ${String(err)}`);
  }
}
