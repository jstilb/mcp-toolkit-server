import { loadConfig, isMockMode, type ServerConfig } from "../../src/config.js";

describe("Config", () => {
  describe("loadConfig", () => {
    it("should return default mock mode", () => {
      const config = loadConfig();
      expect(config.mode).toBe("mock");
    });

    it("should accept overrides", () => {
      const config = loadConfig({ mode: "production", name: "test-server" });
      expect(config.mode).toBe("production");
      expect(config.name).toBe("test-server");
    });

    it("should have default values", () => {
      const config = loadConfig();
      expect(config.name).toBe("mcp-toolkit-server");
      expect(config.version).toBe("0.1.0");
      expect(config.maxConcurrentTools).toBe(5);
      expect(config.toolTimeoutMs).toBe(30000);
    });
  });

  describe("isMockMode", () => {
    it("should return true for mock mode", () => {
      expect(isMockMode(loadConfig({ mode: "mock" }))).toBe(true);
    });

    it("should return true for hybrid mode", () => {
      expect(isMockMode(loadConfig({ mode: "hybrid" }))).toBe(true);
    });

    it("should return false for production mode", () => {
      expect(isMockMode(loadConfig({ mode: "production" }))).toBe(false);
    });
  });
});
