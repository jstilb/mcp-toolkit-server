/**
 * Basic usage example - demonstrates tools directly.
 *
 * Run: bun run examples/basic-usage.ts
 */

import { loadConfig } from "../src/config.js";
import { createProviders } from "../src/providers/index.js";
import { summarize, analyzeSentiment, extractEntities } from "../src/tools/text-analysis.js";

async function main() {
  const config = loadConfig({ mode: "mock" });
  const providers = createProviders(config);

  const text =
    "OpenAI released GPT-4 in San Francisco. The model shows significant " +
    "improvements over previous versions. Google and Anthropic are also " +
    "making great progress in AI safety research using TypeScript and Python.";

  console.log("Input:", text);
  console.log();

  // Summarize
  const summary = await summarize({ text, maxLength: 30 }, providers.text);
  console.log("Summary:", summary.ok ? summary.value : summary.error);

  // Sentiment
  const sentiment = await analyzeSentiment({ text }, providers.text);
  if (sentiment.ok) {
    console.log(`Sentiment: ${sentiment.value.sentiment} (${sentiment.value.confidence.toFixed(2)})`);
  }

  // Entities
  const entities = await extractEntities(
    { text, types: ["organization", "location", "technology"] },
    providers.text
  );
  if (entities.ok) {
    console.log("Entities:", entities.value.map(e => `${e.text} (${e.type})`).join(", "));
  }
}

main().catch(console.error);
