/**
 * Elicitation tool: configure_analysis
 *
 * Demonstrates MCP elicitation by asking the user structured
 * follow-up questions via elicitation/create, then handling
 * all three response actions: accept, decline, cancel.
 */

import { z } from "zod";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Ok, type Result } from "../result.js";

export const ConfigureAnalysisSchema = z.object({
  text: z
    .string()
    .min(1)
    .describe("Text to analyze — elicitation will ask for configuration options"),
});

export type ConfigureAnalysisInput = z.infer<typeof ConfigureAnalysisSchema>;

export interface AnalysisConfig {
  depth: "quick" | "standard" | "deep";
  includeSentiment: boolean;
  includeEntities: boolean;
  maxSummaryWords: number;
}

export interface ConfigureAnalysisResult {
  action: "accept" | "decline" | "cancel";
  config?: AnalysisConfig;
  message: string;
}

/**
 * Elicitation JSON schema for analysis configuration form.
 * Sent to the client as part of elicitation/create.
 * Must use PrimitiveSchemaDefinition compatible shapes.
 */
const ANALYSIS_CONFIG_SCHEMA = {
  type: "object" as const,
  properties: {
    depth: {
      type: "string" as const,
      enum: ["quick", "standard", "deep"] as string[],
      description: "Analysis depth level",
      default: "standard",
    },
    includeSentiment: {
      type: "boolean" as const,
      description: "Include sentiment analysis",
      default: true,
    },
    includeEntities: {
      type: "boolean" as const,
      description: "Include entity extraction",
      default: true,
    },
    maxSummaryWords: {
      type: "number" as const,
      description: "Maximum words in summary",
      default: 100,
    },
  },
  required: ["depth", "includeSentiment", "includeEntities", "maxSummaryWords"],
};

export async function configureAnalysis(
  input: ConfigureAnalysisInput,
  server: Server
): Promise<Result<ConfigureAnalysisResult>> {
  let elicitResult: { action: string; content?: unknown };

  try {
    elicitResult = await server.elicitInput({
      message: `Configure analysis options for the provided text (${input.text.length} characters):`,
      requestedSchema: ANALYSIS_CONFIG_SCHEMA,
    });
  } catch (_err) {
    // If elicitation is not supported by the client, use defaults
    return Ok({
      action: "accept",
      config: {
        depth: "standard",
        includeSentiment: true,
        includeEntities: true,
        maxSummaryWords: 100,
      },
      message: "Using default configuration (elicitation not supported by client).",
    });
  }

  if (elicitResult.action === "accept" && elicitResult.content != null) {
    // Parse the user-submitted form data
    const raw = elicitResult.content as Record<string, unknown>;
    const config: AnalysisConfig = {
      depth: (raw["depth"] as AnalysisConfig["depth"]) ?? "standard",
      includeSentiment: Boolean(raw["includeSentiment"] ?? true),
      includeEntities: Boolean(raw["includeEntities"] ?? true),
      maxSummaryWords: Number(raw["maxSummaryWords"] ?? 100),
    };

    return Ok({
      action: "accept",
      config,
      message: `Analysis configured: depth=${config.depth}, sentiment=${config.includeSentiment}, entities=${config.includeEntities}, maxWords=${config.maxSummaryWords}`,
    });
  }

  if (elicitResult.action === "decline") {
    return Ok({
      action: "decline",
      message: "User declined to configure analysis. Using default settings would be required to proceed.",
    });
  }

  // action === "cancel"
  return Ok({
    action: "cancel",
    message: "User cancelled the analysis configuration dialog.",
  });
}
