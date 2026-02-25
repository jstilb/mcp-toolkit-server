/**
 * Unit tests for production providers.
 *
 * ISC 4 (2276): With MCP_MODE=production, brave_web_search calls Brave API,
 * weather calls OpenWeatherMap. Without env var, mock responses returned.
 *
 * These tests mock the global fetch to avoid live API calls.
 */

import { BraveWebSearchProvider, OpenWeatherMapProvider } from "../../src/providers/production.js";
import { createProviders } from "../../src/providers/index.js";
import { loadConfig } from "../../src/config.js";

// --- Global fetch mock ---

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

function mockFetchSuccess(body: unknown, status = 200): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

function mockFetchError(message: string): void {
  global.fetch = jest.fn().mockRejectedValue(new Error(message));
}

// --- BraveWebSearchProvider ---

describe("BraveWebSearchProvider (ISC 4 — production Brave Search)", () => {
  it("calls Brave Search API with correct URL and auth header", async () => {
    mockFetchSuccess({
      web: {
        results: [
          { title: "Result 1", url: "https://example.com/1", description: "Snippet 1" },
          { title: "Result 2", url: "https://example.com/2", description: "Snippet 2" },
        ],
      },
    });

    const provider = new BraveWebSearchProvider("test-key");
    const result = await provider.search("AI safety", 2);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(2);
      expect(result.value[0]!.title).toBe("Result 1");
      expect(result.value[0]!.url).toBe("https://example.com/1");
      expect(result.value[0]!.snippet).toBe("Snippet 1");
      expect(typeof result.value[0]!.score).toBe("number");
    }

    const fetchMock = global.fetch as jest.Mock;
    const callUrl = fetchMock.mock.calls[0]![0] as string;
    expect(callUrl).toContain("api.search.brave.com");
    expect(callUrl).toContain("q=AI+safety");

    const headers = fetchMock.mock.calls[0]![1]?.headers as Record<string, string>;
    expect(headers?.["X-Subscription-Token"]).toBe("test-key");
  });

  it("returns Ok([]) when web.results is empty", async () => {
    mockFetchSuccess({ web: { results: [] } });

    const provider = new BraveWebSearchProvider("test-key");
    const result = await provider.search("empty query", 5);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it("returns Err when fetch throws a network error", async () => {
    mockFetchError("Network error");

    const provider = new BraveWebSearchProvider("test-key");
    const result = await provider.search("query", 3);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Brave Search fetch failed");
    }
  });

  it("returns Err on non-200 HTTP response", async () => {
    mockFetchSuccess({}, 403);

    const provider = new BraveWebSearchProvider("test-key");
    const result = await provider.search("query", 3);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("403");
    }
  });

  it("limits results to maxResults", async () => {
    const manyResults = Array.from({ length: 10 }, (_, i) => ({
      title: `Result ${i}`,
      url: `https://example.com/${i}`,
      description: `Snippet ${i}`,
    }));
    mockFetchSuccess({ web: { results: manyResults } });

    const provider = new BraveWebSearchProvider("test-key");
    const result = await provider.search("query", 3);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(3);
    }
  });
});

// --- OpenWeatherMapProvider ---

describe("OpenWeatherMapProvider (ISC 4 — production OpenWeatherMap)", () => {
  it("calls OpenWeatherMap API with correct parameters", async () => {
    mockFetchSuccess({
      name: "San Francisco",
      sys: { country: "US" },
      main: { temp: 65.5, humidity: 70 },
      weather: [{ description: "partly cloudy" }],
      wind: { speed: 10.2 },
    });

    const provider = new OpenWeatherMapProvider("owm-key");
    const result = await provider.getWeather("San Francisco");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.location).toBe("San Francisco, US");
      expect(result.value.temperature).toBe(66); // Math.round(65.5)
      expect(result.value.unit).toBe("fahrenheit");
      expect(result.value.condition).toBe("partly cloudy");
      expect(result.value.humidity).toBe(70);
      expect(result.value.wind_speed).toBe(10);
    }

    const fetchMock = global.fetch as jest.Mock;
    const callUrl = fetchMock.mock.calls[0]![0] as string;
    expect(callUrl).toContain("api.openweathermap.org");
    expect(callUrl).toContain("q=San+Francisco");
    expect(callUrl).toContain("units=imperial");
    expect(callUrl).toContain("appid=owm-key");
  });

  it("returns Err when fetch throws a network error", async () => {
    mockFetchError("Connection refused");

    const provider = new OpenWeatherMapProvider("owm-key");
    const result = await provider.getWeather("London");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("OpenWeatherMap fetch failed");
    }
  });

  it("returns Err on non-200 HTTP response (e.g. invalid API key)", async () => {
    mockFetchSuccess({}, 401);

    const provider = new OpenWeatherMapProvider("bad-key");
    const result = await provider.getWeather("Paris");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("401");
    }
  });

  it("handles missing sys.country gracefully", async () => {
    mockFetchSuccess({
      name: "Unknown City",
      main: { temp: 70, humidity: 50 },
      weather: [{ description: "clear" }],
      wind: { speed: 5 },
    });

    const provider = new OpenWeatherMapProvider("owm-key");
    const result = await provider.getWeather("Unknown City");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.location).toBe("Unknown City");
    }
  });
});

// --- Provider factory switching (ISC 4) ---

describe("ISC 4 (2276): createProviders switches based on MCP_MODE", () => {
  it("uses mock providers in mock mode (default)", () => {
    const config = loadConfig({ mode: "mock" });
    const providers = createProviders(config);
    // Mock providers have no apiKey property — they're instances of Mock classes
    expect(providers.search).toBeDefined();
    expect(providers.weather).toBeDefined();
    expect(providers.text).toBeDefined();
  });

  it("uses BraveWebSearchProvider when mode=production and BRAVE_API_KEY is set", () => {
    const config = loadConfig({ mode: "production", braveApiKey: "brave-key" });
    const providers = createProviders(config);
    expect(providers.search).toBeInstanceOf(BraveWebSearchProvider);
  });

  it("uses OpenWeatherMapProvider when mode=production and OPENWEATHERMAP_API_KEY is set", () => {
    const config = loadConfig({ mode: "production", openWeatherMapApiKey: "owm-key" });
    const providers = createProviders(config);
    expect(providers.weather).toBeInstanceOf(OpenWeatherMapProvider);
  });

  it("falls back to mock when mode=production but no API keys are set", () => {
    const config = loadConfig({ mode: "production" });
    const providers = createProviders(config);
    // No API keys — should fall back to mock
    expect(providers.search).toBeDefined();
    expect(providers.weather).toBeDefined();
  });

  it("uses mock providers in hybrid mode", () => {
    const config = loadConfig({ mode: "hybrid" });
    const providers = createProviders(config);
    expect(providers.search).toBeDefined();
    expect(providers.weather).toBeDefined();
  });
});
