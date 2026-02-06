/**
 * Weather tool for the MCP server.
 *
 * Provides current weather and forecast data
 * using injected weather providers.
 */

import { z } from "zod";
import type { WeatherProvider, WeatherData } from "../providers/provider.js";
import { type Result } from "../result.js";

// --- Schemas ---

export const WeatherSchema = z.object({
  location: z.string().min(1).describe("City or location name"),
  unit: z
    .enum(["celsius", "fahrenheit"])
    .optional()
    .default("fahrenheit")
    .describe("Temperature unit"),
});

export type WeatherInput = z.infer<typeof WeatherSchema>;

// --- Tool Implementation ---

export async function getWeather(
  input: WeatherInput,
  provider: WeatherProvider
): Promise<Result<WeatherData>> {
  return provider.getWeather(input.location);
}
