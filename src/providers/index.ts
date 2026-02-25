/**
 * Provider factory for creating mock or production providers.
 *
 * When MCP_MODE=production:
 *   - brave_web_search uses BraveWebSearchProvider (requires BRAVE_API_KEY)
 *   - weather uses OpenWeatherMapProvider (requires OPENWEATHERMAP_API_KEY)
 *
 * Default (mock mode): all providers return deterministic mock responses.
 */

import type { ServerConfig } from "../config.js";
import {
  MockTextProvider,
  MockWebSearchProvider,
  MockWeatherProvider,
} from "./mock.js";
import {
  BraveWebSearchProvider,
  OpenWeatherMapProvider,
} from "./production.js";
import type {
  TextProvider,
  WebSearchProvider,
  WeatherProvider,
} from "./provider.js";

export interface Providers {
  text: TextProvider;
  search: WebSearchProvider;
  weather: WeatherProvider;
}

export function createProviders(config: ServerConfig): Providers {
  if (config.mode === "production") {
    const search: WebSearchProvider = config.braveApiKey
      ? new BraveWebSearchProvider(config.braveApiKey)
      : new MockWebSearchProvider();

    const weather: WeatherProvider = config.openWeatherMapApiKey
      ? new OpenWeatherMapProvider(config.openWeatherMapApiKey)
      : new MockWeatherProvider();

    return {
      text: new MockTextProvider(),
      search,
      weather,
    };
  }

  // mock or hybrid — use all mock providers
  return {
    text: new MockTextProvider(),
    search: new MockWebSearchProvider(),
    weather: new MockWeatherProvider(),
  };
}

export type { TextProvider, WebSearchProvider, WeatherProvider } from "./provider.js";
export type { SearchResult, WeatherData, CompletionOptions } from "./provider.js";
