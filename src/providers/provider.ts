/**
 * Provider interface for dependency injection.
 *
 * All external service integrations implement this interface,
 * enabling mock/production swapping at runtime.
 */

import { Result } from "../result.js";

export interface TextProvider {
  complete(prompt: string, options?: CompletionOptions): Promise<Result<string>>;
}

export interface WebSearchProvider {
  search(query: string, maxResults?: number): Promise<Result<SearchResult[]>>;
}

export interface WeatherProvider {
  getWeather(location: string): Promise<Result<WeatherData>>;
}

export interface CompletionOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  unit: "celsius" | "fahrenheit";
  condition: string;
  humidity: number;
  wind_speed: number;
  forecast: string;
}
