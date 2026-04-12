import { describe, expect, it } from "vitest";
import { parseFoodResponseText, stripCodeFences } from "./parse-food-response";

describe("stripCodeFences", () => {
  it("removes json fences", () => {
    expect(stripCodeFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
  it("removes plain fences", () => {
    expect(stripCodeFences("```\n{\"x\":2}\n```")).toBe('{"x":2}');
  });
});

describe("parseFoodResponseText", () => {
  it("parses minimal valid JSON", () => {
    const r = parseFoodResponseText(
      '{"food_name":"Chicken Rice","serving_size":"1 plate","calories":600,"protein_g":30,"carbs_g":70,"fat_g":15,"fibre_g":2,"sugar_g":3,"source_url":"","source_name":"HPB"}',
    );
    expect(r.food_name).toBe("Chicken Rice");
    expect(r.calories).toBe(600);
  });

  it("parses fenced JSON", () => {
    const r = parseFoodResponseText(
      '```json\n{"food_name":"Milo","serving_size":"1 cup","calories":100,"protein_g":2,"carbs_g":15,"fat_g":1,"fibre_g":0,"sugar_g":12,"source_url":"","source_name":""}\n```',
    );
    expect(r.food_name).toBe("Milo");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseFoodResponseText("not json")).toThrow();
  });

  it("throws when food_name empty", () => {
    expect(() =>
      parseFoodResponseText(
        '{"food_name":"","serving_size":"","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"fibre_g":0,"sugar_g":0,"source_url":"","source_name":""}',
      ),
    ).toThrow();
  });
});
