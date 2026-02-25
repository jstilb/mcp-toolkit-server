/**
 * Production providers that call real external APIs.
 *
 * Used when MCP_MODE=production. Requires:
 * - BRAVE_API_KEY for web search
 * - OPENWEATHERMAP_API_KEY for weather
 */

import { Ok, Err, type Result } from "../result.js";
import type {
  WebSearchProvider,
  WeatherProvider,
  SearchResult,
  WeatherData,
} from "./provider.js";

// --- Brave Search Provider ---

interface BraveSearchResponse {
  web?: {
    results?: Array<{
      title: string;
      url: string;
      description?: string;
    }>;
  };
}

export class BraveWebSearchProvider implements WebSearchProvider {
  constructor(private readonly apiKey: string) {}

  async search(query: string, maxResults = 5): Promise<Result<SearchResult[]>> {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(Math.min(maxResults, 20)));

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": this.apiKey,
        },
      });
    } catch (err) {
      return Err(`Brave Search fetch failed: ${String(err)}`);
    }

    if (!response.ok) {
      return Err(`Brave Search API error: HTTP ${response.status}`);
    }

    let data: BraveSearchResponse;
    try {
      data = (await response.json()) as BraveSearchResponse;
    } catch {
      return Err("Failed to parse Brave Search response");
    }

    const rawResults = data.web?.results ?? [];
    const results: SearchResult[] = rawResults
      .slice(0, maxResults)
      .map((r, i) => ({
        title: r.title,
        url: r.url,
        snippet: r.description ?? "",
        score: 1.0 - i * 0.1,
      }));

    return Ok(results);
  }
}

// --- OpenWeatherMap Provider ---

interface OWMCurrentResponse {
  name: string;
  sys?: { country?: string };
  main: {
    temp: number;
    humidity: number;
  };
  weather: Array<{ description: string }>;
  wind: { speed: number };
}

export class OpenWeatherMapProvider implements WeatherProvider {
  constructor(private readonly apiKey: string) {}

  async getWeather(location: string): Promise<Result<WeatherData>> {
    const url = new URL("https://api.openweathermap.org/data/2.5/weather");
    url.searchParams.set("q", location);
    url.searchParams.set("appid", this.apiKey);
    url.searchParams.set("units", "imperial");

    let response: Response;
    try {
      response = await fetch(url.toString());
    } catch (err) {
      return Err(`OpenWeatherMap fetch failed: ${String(err)}`);
    }

    if (!response.ok) {
      return Err(`OpenWeatherMap API error: HTTP ${response.status}`);
    }

    let data: OWMCurrentResponse;
    try {
      data = (await response.json()) as OWMCurrentResponse;
    } catch {
      return Err("Failed to parse OpenWeatherMap response");
    }

    const countryCode = data.sys?.country;
    const locationName = countryCode
      ? `${data.name}, ${countryCode}`
      : data.name;

    return Ok({
      location: locationName,
      temperature: Math.round(data.main.temp),
      unit: "fahrenheit",
      condition: data.weather[0]?.description ?? "Unknown",
      humidity: data.main.humidity,
      wind_speed: Math.round(data.wind.speed),
      forecast: `Current conditions for ${locationName}`,
    });
  }
}
