import { describe, expect, it } from "vitest";
import { parseOpenCodeFreeModels, parseOpenRouterFreeModels } from "../lib/free-models";

describe("free model directory parsing", () => {
  it("keeps zero-price text models and marks stealth OpenRouter entries", () => {
    const models = parseOpenRouterFreeModels({ data: [
      { id: "stealth/test-alpha", name: "Test Alpha", context_length: 200000, pricing: { prompt: "0", completion: "0" }, architecture: { output_modalities: ["text"] } },
      { id: "paid/model", name: "Paid", context_length: 1000, pricing: { prompt: "0.1", completion: "0" }, architecture: { output_modalities: ["text"] } },
      { id: "audio/model", name: "Audio", context_length: 1000, pricing: { prompt: "0", completion: "0" }, architecture: { output_modalities: ["audio"] } },
    ] });
    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({ id: "stealth/test-alpha", stealth: true, contextLength: 200000 });
  });

  it("recognizes current OpenCode free and stealth ids", () => {
    const models = parseOpenCodeFreeModels({ data: [
      { id: "big-pickle" },
      { id: "ling-3.0-flash-fin-free" },
      { id: "deepseek-v4-flash-free" },
      { id: "laguna-s-2.1-free" },
      { id: "unverified-free" },
      { id: "paid-model" },
    ] });
    expect(models.map((model) => model.id)).toEqual(["big-pickle", "deepseek-v4-flash-free", "laguna-s-2.1-free", "ling-3.0-flash-fin-free"]);
    expect(models.find((model) => model.id === "big-pickle")?.stealth).toBe(true);
    expect(models.find((model) => model.id === "ling-3.0-flash-fin-free")?.stealth).toBe(false);
  });
});
