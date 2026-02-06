import {
  summarize,
  analyzeSentiment,
  extractEntities,
} from "../../src/tools/text-analysis.js";
import { webSearch } from "../../src/tools/web-search.js";
import { getWeather } from "../../src/tools/weather.js";
import {
  MockTextProvider,
  MockWebSearchProvider,
  MockWeatherProvider,
} from "../../src/providers/mock.js";

describe("Text Analysis Tools", () => {
  const textProvider = new MockTextProvider();

  describe("summarize", () => {
    it("should return Ok with summary text", async () => {
      const result = await summarize(
        { text: "A long document about AI and machine learning.", maxLength: 50 },
        textProvider
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
      }
    });

    it("should handle different text lengths", async () => {
      const short = await summarize({ text: "Short text.", maxLength: 10 }, textProvider);
      const long = await summarize(
        { text: "A ".repeat(100) + "very long text about many topics.", maxLength: 200 },
        textProvider
      );
      expect(short.ok).toBe(true);
      expect(long.ok).toBe(true);
    });
  });

  describe("analyzeSentiment", () => {
    it("should detect positive sentiment", async () => {
      const result = await analyzeSentiment(
        { text: "This is great and amazing! I love this wonderful product." },
        textProvider
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sentiment).toBe("positive");
        expect(result.value.confidence).toBeGreaterThan(0.5);
      }
    });

    it("should detect negative sentiment", async () => {
      const result = await analyzeSentiment(
        { text: "This is terrible and awful. The worst experience ever." },
        textProvider
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sentiment).toBe("negative");
      }
    });

    it("should detect neutral sentiment", async () => {
      const result = await analyzeSentiment(
        { text: "The meeting is scheduled for Tuesday at 3pm in the conference room." },
        textProvider
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sentiment).toBe("neutral");
      }
    });

    it("should detect mixed sentiment", async () => {
      const result = await analyzeSentiment(
        { text: "The product has great features but terrible customer support." },
        textProvider
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.sentiment).toBe("mixed");
      }
    });

    it("should return confidence between 0 and 1", async () => {
      const result = await analyzeSentiment({ text: "test text" }, textProvider);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.confidence).toBeGreaterThanOrEqual(0);
        expect(result.value.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe("extractEntities", () => {
    it("should extract organizations", async () => {
      const result = await extractEntities(
        {
          text: "Google and Microsoft are investing in AI research.",
          types: ["organization"],
        },
        textProvider
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        const orgNames = result.value.map((e) => e.text.toLowerCase());
        expect(orgNames).toContain("google");
        expect(orgNames).toContain("microsoft");
      }
    });

    it("should extract locations", async () => {
      const result = await extractEntities(
        {
          text: "The conference is in San Francisco and New York.",
          types: ["location"],
        },
        textProvider
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.length).toBeGreaterThan(0);
        expect(result.value.every((e) => e.type === "location")).toBe(true);
      }
    });

    it("should extract technologies", async () => {
      const result = await extractEntities(
        {
          text: "We use TypeScript and Python with Docker for deployment.",
          types: ["technology"],
        },
        textProvider
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        const techs = result.value.map((e) => e.text.toLowerCase());
        expect(techs).toContain("typescript");
        expect(techs).toContain("python");
        expect(techs).toContain("docker");
      }
    });

    it("should return empty for no matches", async () => {
      const result = await extractEntities(
        { text: "just some regular words here", types: ["organization"] },
        textProvider
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual([]);
      }
    });

    it("should deduplicate entities", async () => {
      const result = await extractEntities(
        {
          text: "Google announced today. Google also released a new product.",
          types: ["organization"],
        },
        textProvider
      );
      expect(result.ok).toBe(true);
      if (result.ok) {
        const googleCount = result.value.filter(
          (e) => e.text.toLowerCase() === "google"
        ).length;
        expect(googleCount).toBe(1);
      }
    });
  });
});

describe("Web Search Tool", () => {
  const searchProvider = new MockWebSearchProvider();

  it("should return search results", async () => {
    const result = await webSearch(
      { query: "test query", maxResults: 3 },
      searchProvider
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(3);
      expect(result.value[0]!.title).toBeTruthy();
      expect(result.value[0]!.url).toMatch(/^https?:\/\//);
    }
  });

  it("should respect maxResults", async () => {
    const result = await webSearch(
      { query: "test", maxResults: 2 },
      searchProvider
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.length).toBe(2);
    }
  });

  it("should return results with decreasing scores", async () => {
    const result = await webSearch(
      { query: "ranked results", maxResults: 5 },
      searchProvider
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      for (let i = 1; i < result.value.length; i++) {
        expect(result.value[i]!.score).toBeLessThanOrEqual(
          result.value[i - 1]!.score
        );
      }
    }
  });
});

describe("Weather Tool", () => {
  const weatherProvider = new MockWeatherProvider();

  it("should return weather for known location", async () => {
    const result = await getWeather(
      { location: "San Francisco", unit: "fahrenheit" },
      weatherProvider
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.location).toBe("San Francisco, CA");
      expect(result.value.temperature).toBe(62);
      expect(result.value.condition).toBeTruthy();
    }
  });

  it("should return weather for unknown location", async () => {
    const result = await getWeather(
      { location: "Timbuktu", unit: "fahrenheit" },
      weatherProvider
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.location).toBe("Timbuktu");
      expect(typeof result.value.temperature).toBe("number");
    }
  });
});
