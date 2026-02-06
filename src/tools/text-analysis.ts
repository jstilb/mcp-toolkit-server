/**
 * Text analysis tools for the MCP server.
 *
 * Provides text summarization, sentiment analysis, and entity extraction
 * using injected text providers (mock or production).
 */

import { z } from "zod";
import type { TextProvider } from "../providers/provider.js";
import { Ok, Err, type Result } from "../result.js";

// --- Schemas ---

export const SummarizeSchema = z.object({
  text: z.string().min(1).describe("Text to summarize"),
  maxLength: z
    .number()
    .int()
    .positive()
    .optional()
    .default(100)
    .describe("Maximum summary length in words"),
});

export const SentimentSchema = z.object({
  text: z.string().min(1).describe("Text to analyze sentiment of"),
});

export const EntitySchema = z.object({
  text: z.string().min(1).describe("Text to extract entities from"),
  types: z
    .array(z.enum(["person", "organization", "location", "date", "technology"]))
    .optional()
    .default(["person", "organization", "location"])
    .describe("Entity types to extract"),
});

// --- Types ---

export type SummarizeInput = z.infer<typeof SummarizeSchema>;
export type SentimentInput = z.infer<typeof SentimentSchema>;
export type EntityInput = z.infer<typeof EntitySchema>;

export interface SentimentResult {
  sentiment: "positive" | "negative" | "neutral" | "mixed";
  confidence: number;
  explanation: string;
}

export interface Entity {
  text: string;
  type: string;
  confidence: number;
}

// --- Tool Implementations ---

export async function summarize(
  input: SummarizeInput,
  provider: TextProvider
): Promise<Result<string>> {
  const prompt = `Summarize the following text in ${input.maxLength} words or fewer:\n\n${input.text}`;
  return provider.complete(prompt, { maxTokens: input.maxLength * 2 });
}

export async function analyzeSentiment(
  input: SentimentInput,
  _provider: TextProvider
): Promise<Result<SentimentResult>> {
  const text = input.text.toLowerCase();

  // Heuristic sentiment analysis (mock-friendly, no API needed)
  const positiveWords = [
    "good", "great", "excellent", "amazing", "wonderful", "love", "best",
    "happy", "fantastic", "brilliant", "outstanding", "perfect",
  ];
  const negativeWords = [
    "bad", "terrible", "awful", "worst", "hate", "horrible", "poor",
    "disappointing", "failure", "broken", "useless", "wrong",
  ];

  const words = text.split(/\s+/);
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (positiveWords.some((pw) => word.includes(pw))) positiveCount++;
    if (negativeWords.some((nw) => word.includes(nw))) negativeCount++;
  }

  const total = positiveCount + negativeCount;

  let sentiment: SentimentResult["sentiment"];
  let confidence: number;
  let explanation: string;

  if (total === 0) {
    sentiment = "neutral";
    confidence = 0.6;
    explanation = "No strong sentiment indicators found in the text.";
  } else if (positiveCount > 0 && negativeCount > 0) {
    sentiment = "mixed";
    confidence = 0.5 + Math.abs(positiveCount - negativeCount) / (total * 2);
    explanation = `Found ${positiveCount} positive and ${negativeCount} negative indicators.`;
  } else if (positiveCount > negativeCount) {
    sentiment = "positive";
    confidence = 0.6 + Math.min(0.35, positiveCount * 0.1);
    explanation = `Strong positive sentiment with ${positiveCount} positive indicators.`;
  } else {
    sentiment = "negative";
    confidence = 0.6 + Math.min(0.35, negativeCount * 0.1);
    explanation = `Negative sentiment detected with ${negativeCount} negative indicators.`;
  }

  return Ok({ sentiment, confidence: Math.min(confidence, 1.0), explanation });
}

export async function extractEntities(
  input: EntityInput,
  _provider: TextProvider
): Promise<Result<Entity[]>> {
  const text = input.text;
  const entities: Entity[] = [];

  // Simple pattern-based entity extraction (mock-friendly)
  const patterns: Record<string, RegExp> = {
    person: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
    organization: /\b(?:Google|Microsoft|Apple|Amazon|Meta|OpenAI|Anthropic|Netflix|Tesla)\b/gi,
    location:
      /\b(?:New York|San Francisco|London|Tokyo|Paris|Berlin|Seattle|Austin|Chicago)\b/gi,
    date: /\b\d{4}[-/]\d{2}[-/]\d{2}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    technology:
      /\b(?:Python|TypeScript|JavaScript|React|Docker|Kubernetes|GraphQL|REST|PostgreSQL|MongoDB|Redis|LangChain|ChromaDB)\b/gi,
  };

  for (const type of input.types) {
    const pattern = patterns[type];
    if (!pattern) continue;

    const matches = text.matchAll(pattern);
    const seen = new Set<string>();

    for (const match of matches) {
      const entityText = match[0];
      if (!seen.has(entityText.toLowerCase())) {
        seen.add(entityText.toLowerCase());
        entities.push({
          text: entityText,
          type,
          confidence: 0.85,
        });
      }
    }
  }

  return Ok(entities);
}
