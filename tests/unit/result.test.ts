import { Ok, Err, unwrapOr, mapResult, type Result } from "../../src/result.js";

describe("Result type", () => {
  describe("Ok", () => {
    it("should create Ok result", () => {
      const result = Ok(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it("should work with string values", () => {
      const result = Ok("hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe("hello");
      }
    });

    it("should work with complex objects", () => {
      const data = { key: "value", count: 5 };
      const result = Ok(data);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual(data);
      }
    });
  });

  describe("Err", () => {
    it("should create Err result", () => {
      const result = Err("something failed");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("something failed");
      }
    });
  });

  describe("unwrapOr", () => {
    it("should return value for Ok", () => {
      const result = Ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it("should return default for Err", () => {
      const result: Result<number> = Err("fail");
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe("mapResult", () => {
    it("should map Ok values", () => {
      const result = Ok(5);
      const mapped = mapResult(result, (x) => x * 2);
      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(10);
      }
    });

    it("should pass through Err", () => {
      const result: Result<number> = Err("fail");
      const mapped = mapResult(result, (x) => x * 2);
      expect(mapped.ok).toBe(false);
    });
  });
});
