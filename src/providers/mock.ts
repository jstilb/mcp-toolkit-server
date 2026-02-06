/**
 * Mock providers for demo and testing.
 *
 * Return deterministic, plausible responses without
 * requiring any API keys or external services.
 */

import { Ok, Err, type Result } from "../result.js";
import type {
  TextProvider,
  WebSearchProvider,
  WeatherProvider,
  CompletionOptions,
  SearchResult,
  WeatherData,
} from "./provider.js";

export class MockTextProvider implements TextProvider {
  async complete(
    prompt: string,
    _options?: CompletionOptions
  ): Promise<Result<string>> {
    // Generate a deterministic response based on the prompt
    const words = prompt.toLowerCase().split(/\s+/);
    const topics = words.slice(0, 5).join(", ");

    const templates = [
      `Based on the analysis of ${topics}, the key findings suggest a nuanced perspective. The evidence points to several interconnected factors that influence the outcome.`,
      `Regarding ${topics}: the current understanding indicates multiple contributing factors. Research suggests that a comprehensive approach yields the best results.`,
      `The topic of ${topics} involves several important considerations. A balanced assessment reveals both strengths and areas for further investigation.`,
    ];

    const index = prompt.length % templates.length;
    return Ok(templates[index]!);
  }
}

export class MockWebSearchProvider implements WebSearchProvider {
  async search(
    query: string,
    maxResults = 5
  ): Promise<Result<SearchResult[]>> {
    const words = query.toLowerCase().split(/\s+/);
    const results: SearchResult[] = [];

    const domains = [
      "docs.example.com",
      "blog.techsite.com",
      "research.papers.io",
      "tutorial.dev",
      "wiki.knowledge.org",
    ];

    for (let i = 0; i < Math.min(maxResults, domains.length); i++) {
      results.push({
        title: `${words.slice(0, 3).join(" ")} - Result ${i + 1}`,
        url: `https://${domains[i]}/${words.join("-")}`,
        snippet: `Comprehensive guide about ${query}. This resource covers the fundamentals and advanced topics related to ${words.slice(0, 2).join(" ")}.`,
        score: 1.0 - i * 0.15,
      });
    }

    return Ok(results);
  }
}

export class MockWeatherProvider implements WeatherProvider {
  private readonly mockData: Record<string, WeatherData> = {
    "san francisco": {
      location: "San Francisco, CA",
      temperature: 62,
      unit: "fahrenheit",
      condition: "Partly Cloudy",
      humidity: 72,
      wind_speed: 12,
      forecast: "Mild with coastal fog clearing by afternoon",
    },
    "new york": {
      location: "New York, NY",
      temperature: 45,
      unit: "fahrenheit",
      condition: "Clear",
      humidity: 55,
      wind_speed: 8,
      forecast: "Clear skies with seasonal temperatures",
    },
    london: {
      location: "London, UK",
      temperature: 8,
      unit: "celsius",
      condition: "Overcast",
      humidity: 85,
      wind_speed: 15,
      forecast: "Grey skies with chance of light rain",
    },
  };

  async getWeather(location: string): Promise<Result<WeatherData>> {
    const key = location.toLowerCase().trim();
    const data = this.mockData[key];

    if (data) {
      return Ok(data);
    }

    // Generate plausible data for unknown locations
    return Ok({
      location,
      temperature: 70,
      unit: "fahrenheit",
      condition: "Clear",
      humidity: 50,
      wind_speed: 10,
      forecast: `Typical conditions for ${location}`,
    });
  }
}
