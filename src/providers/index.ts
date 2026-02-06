/**
 * Provider factory for creating mock or production providers.
 */

import type { ServerConfig } from "../config.js";
import { isMockMode } from "../config.js";
import {
  MockTextProvider,
  MockWebSearchProvider,
  MockWeatherProvider,
} from "./mock.js";
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
  if (isMockMode(config)) {
    return {
      text: new MockTextProvider(),
      search: new MockWebSearchProvider(),
      weather: new MockWeatherProvider(),
    };
  }

  // Production providers would go here
  // For now, fall back to mock
  return {
    text: new MockTextProvider(),
    search: new MockWebSearchProvider(),
    weather: new MockWeatherProvider(),
  };
}

export type { TextProvider, WebSearchProvider, WeatherProvider } from "./provider.js";
export type { SearchResult, WeatherData, CompletionOptions } from "./provider.js";
