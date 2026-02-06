/**
 * Demo script - demonstrates tools, resources, and prompts.
 *
 * Runs all toolkit capabilities in mock mode without
 * requiring any API keys or external services.
 */

import { loadConfig } from "./config.js";
import { createProviders } from "./providers/index.js";
import { summarize, analyzeSentiment, extractEntities } from "./tools/text-analysis.js";
import { webSearch } from "./tools/web-search.js";
import { getWeather } from "./tools/weather.js";
import { readResource, getResourceDefinitions } from "./resources/index.js";
import { getPromptDefinitions, generatePromptMessages } from "./prompts/index.js";

async function main(): Promise<void> {
  console.log("=" .repeat(60));
  console.log("MCP Toolkit Server - Demo");
  console.log("=" .repeat(60));

  const config = loadConfig({ mode: "mock" });
  const providers = createProviders(config);

  // --- Tools ---
  console.log("\n--- Tools Demo ---\n");

  const sampleText =
    "OpenAI and Google are leading artificial intelligence research in San Francisco. " +
    "Their latest models show remarkable capability in natural language understanding. " +
    "TypeScript and Python remain the most popular languages for AI development.";

  // Summarize
  const summary = await summarize({ text: sampleText, maxLength: 50 }, providers.text);
  console.log("1. Summarize:");
  console.log(`   ${summary.ok ? summary.value : summary.error}\n`);

  // Sentiment
  const sentiment = await analyzeSentiment({ text: sampleText }, providers.text);
  console.log("2. Sentiment Analysis:");
  if (sentiment.ok) {
    console.log(`   Sentiment: ${sentiment.value.sentiment}`);
    console.log(`   Confidence: ${sentiment.value.confidence.toFixed(2)}`);
    console.log(`   Explanation: ${sentiment.value.explanation}\n`);
  }

  // Entities
  const entities = await extractEntities(
    { text: sampleText, types: ["organization", "location", "technology"] },
    providers.text
  );
  console.log("3. Entity Extraction:");
  if (entities.ok) {
    for (const entity of entities.value) {
      console.log(`   - ${entity.text} (${entity.type}, ${entity.confidence.toFixed(2)})`);
    }
  }

  // Web Search
  console.log("\n4. Web Search:");
  const search = await webSearch({ query: "MCP protocol AI tools", maxResults: 3 }, providers.search);
  if (search.ok) {
    for (const result of search.value) {
      console.log(`   - ${result.title} (${result.url})`);
    }
  }

  // Weather
  console.log("\n5. Weather:");
  const weather = await getWeather({ location: "San Francisco", unit: "fahrenheit" }, providers.weather);
  if (weather.ok) {
    console.log(`   ${weather.value.location}: ${weather.value.temperature}F, ${weather.value.condition}`);
    console.log(`   Forecast: ${weather.value.forecast}`);
  }

  // --- Resources ---
  console.log("\n\n--- Resources Demo ---\n");
  const resources = getResourceDefinitions();
  for (const r of resources) {
    console.log(`Resource: ${r.name} (${r.uri})`);
    const content = readResource(r.uri, config);
    console.log(`  ${content.substring(0, 100)}...`);
    console.log();
  }

  // --- Prompts ---
  console.log("--- Prompts Demo ---\n");
  const prompts = getPromptDefinitions();
  for (const p of prompts) {
    console.log(`Prompt: ${p.name}`);
    console.log(`  ${p.description}`);
    const messages = generatePromptMessages(
      p.name,
      p.arguments[0] ? { [p.arguments[0].name]: "example value" } : {}
    );
    console.log(`  Preview: ${messages[0]?.content.substring(0, 80)}...`);
    console.log();
  }

  console.log("=" .repeat(60));
  console.log("Demo complete. All tools, resources, and prompts operational.");
}

main().catch(console.error);
