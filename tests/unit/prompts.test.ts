import {
  getPromptDefinitions,
  generatePromptMessages,
} from "../../src/prompts/index.js";

describe("Prompts", () => {
  describe("getPromptDefinitions", () => {
    it("should return prompt definitions", () => {
      const defs = getPromptDefinitions();
      expect(defs.length).toBeGreaterThan(0);
      for (const def of defs) {
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(def.arguments).toBeDefined();
      }
    });

    it("should include research_topic prompt", () => {
      const defs = getPromptDefinitions();
      const research = defs.find((d) => d.name === "research_topic");
      expect(research).toBeDefined();
      expect(research!.arguments.find((a) => a.name === "topic")).toBeDefined();
    });
  });

  describe("generatePromptMessages", () => {
    it("should generate research_topic messages", () => {
      const messages = generatePromptMessages("research_topic", {
        topic: "quantum computing",
        depth: "deep",
      });
      expect(messages.length).toBe(1);
      expect(messages[0]!.role).toBe("user");
      expect(messages[0]!.content).toContain("quantum computing");
      expect(messages[0]!.content).toContain("deep");
    });

    it("should generate analyze_text messages", () => {
      const messages = generatePromptMessages("analyze_text", {
        text: "Sample text for analysis.",
      });
      expect(messages.length).toBe(1);
      expect(messages[0]!.content).toContain("Sample text for analysis");
    });

    it("should generate weather_briefing messages", () => {
      const messages = generatePromptMessages("weather_briefing", {
        location: "Tokyo",
      });
      expect(messages.length).toBe(1);
      expect(messages[0]!.content).toContain("Tokyo");
    });

    it("should handle unknown prompt", () => {
      const messages = generatePromptMessages("nonexistent", {});
      expect(messages.length).toBe(1);
      expect(messages[0]!.content).toContain("Unknown prompt");
    });

    it("should use defaults for missing args", () => {
      const messages = generatePromptMessages("research_topic", {});
      expect(messages.length).toBe(1);
      expect(messages[0]!.content).toContain("general topic");
    });
  });
});
