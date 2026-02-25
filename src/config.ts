/**
 * Server configuration with environment variable support.
 *
 * Supports three modes:
 * - mock: Deterministic responses, no external services needed
 * - production: Real API calls to external services
 * - hybrid: Mix of mock and real services
 */

export type ServerMode = "mock" | "production" | "hybrid";

export interface ServerConfig {
  mode: ServerMode;
  name: string;
  version: string;
  openaiApiKey?: string;
  weatherApiKey?: string;
  braveApiKey?: string;
  openWeatherMapApiKey?: string;
  maxConcurrentTools: number;
  toolTimeoutMs: number;
}

export function loadConfig(overrides?: Partial<ServerConfig>): ServerConfig {
  const env = process.env;

  return {
    mode: (env["MCP_MODE"] as ServerMode) ?? "mock",
    name: env["MCP_SERVER_NAME"] ?? "mcp-toolkit-server",
    version: env["MCP_SERVER_VERSION"] ?? "0.1.0",
    openaiApiKey: env["OPENAI_API_KEY"],
    weatherApiKey: env["WEATHER_API_KEY"],
    braveApiKey: env["BRAVE_API_KEY"],
    openWeatherMapApiKey: env["OPENWEATHERMAP_API_KEY"],
    maxConcurrentTools: parseInt(env["MCP_MAX_CONCURRENT"] ?? "5", 10),
    toolTimeoutMs: parseInt(env["MCP_TOOL_TIMEOUT_MS"] ?? "30000", 10),
    ...overrides,
  };
}

export function isMockMode(config: ServerConfig): boolean {
  return config.mode === "mock" || config.mode === "hybrid";
}
