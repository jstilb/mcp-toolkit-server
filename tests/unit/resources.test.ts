import {
  getResourceDefinitions,
  readResource,
} from "../../src/resources/index.js";
import { loadConfig } from "../../src/config.js";

describe("Resources", () => {
  const config = loadConfig({ mode: "mock" });

  describe("getResourceDefinitions", () => {
    it("should return resource definitions", () => {
      const defs = getResourceDefinitions();
      expect(defs.length).toBeGreaterThan(0);
      for (const def of defs) {
        expect(def.uri).toBeTruthy();
        expect(def.name).toBeTruthy();
        expect(def.mimeType).toBe("application/json");
      }
    });
  });

  describe("readResource", () => {
    it("should read config resource", () => {
      const content = readResource("toolkit://config", config);
      const data = JSON.parse(content);
      expect(data.mode).toBe("mock");
      expect(data.name).toBe("mcp-toolkit-server");
    });

    it("should read tools resource", () => {
      const content = readResource("toolkit://tools", config);
      const data = JSON.parse(content);
      expect(data.tools).toBeDefined();
      expect(data.count).toBe(5);
    });

    it("should read health resource", () => {
      const content = readResource("toolkit://health", config);
      const data = JSON.parse(content);
      expect(data.status).toBe("healthy");
      expect(data.mode).toBe("mock");
    });

    it("should handle unknown resource", () => {
      const content = readResource("toolkit://unknown", config);
      const data = JSON.parse(content);
      expect(data.error).toContain("Unknown resource");
    });
  });
});
