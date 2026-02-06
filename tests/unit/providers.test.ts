import {
  MockTextProvider,
  MockWebSearchProvider,
  MockWeatherProvider,
} from "../../src/providers/mock.js";
import { createProviders } from "../../src/providers/index.js";
import { loadConfig } from "../../src/config.js";

describe("Mock Providers", () => {
  describe("MockTextProvider", () => {
    const provider = new MockTextProvider();

    it("should complete text", async () => {
      const result = await provider.complete("test prompt");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it("should be deterministic", async () => {
      const r1 = await provider.complete("same prompt");
      const r2 = await provider.complete("same prompt");
      expect(r1).toEqual(r2);
    });
  });

  describe("MockWebSearchProvider", () => {
    const provider = new MockWebSearchProvider();

    it("should return search results", async () => {
      const result = await provider.search("test query", 3);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(3);
      }
    });

    it("should limit results", async () => {
      const result = await provider.search("test", 2);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBe(2);
      }
    });
  });

  describe("MockWeatherProvider", () => {
    const provider = new MockWeatherProvider();

    it("should return weather for known cities", async () => {
      const sf = await provider.getWeather("San Francisco");
      expect(sf.ok).toBe(true);
      if (sf.ok) {
        expect(sf.value.temperature).toBe(62);
      }

      const ny = await provider.getWeather("New York");
      expect(ny.ok).toBe(true);
      if (ny.ok) {
        expect(ny.value.temperature).toBe(45);
      }
    });

    it("should handle unknown cities gracefully", async () => {
      const result = await provider.getWeather("Unknown City");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.location).toBe("Unknown City");
        expect(typeof result.value.temperature).toBe("number");
      }
    });
  });
});

describe("Provider Factory", () => {
  it("should create mock providers in mock mode", () => {
    const config = loadConfig({ mode: "mock" });
    const providers = createProviders(config);
    expect(providers.text).toBeDefined();
    expect(providers.search).toBeDefined();
    expect(providers.weather).toBeDefined();
  });

  it("should create providers in production mode (falls back to mock)", () => {
    const config = loadConfig({ mode: "production" });
    const providers = createProviders(config);
    expect(providers.text).toBeDefined();
  });
});
