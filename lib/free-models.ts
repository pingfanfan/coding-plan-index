export interface LiveFreeModel {
  id: string;
  name: string;
  contextLength: number | null;
  stealth: boolean;
  codingRelevant: boolean;
  privacyNote?: string;
}

interface OpenRouterModelRecord {
  id?: unknown;
  name?: unknown;
  context_length?: unknown;
  description?: unknown;
  pricing?: { prompt?: unknown; completion?: unknown };
  architecture?: { output_modalities?: unknown };
}

const openCodeNames: Record<string, string> = {
  "big-pickle": "Big Pickle",
  "x-preview-f-free": "Ox Alpha Free",
  "mimo-v2.5-free": "MiMo-V2.5 Free",
  "hy3-free": "Hy3 Free",
  "nemotron-3-ultra-free": "Nemotron 3 Ultra Free",
  "nemotron-3.5-lightning-free": "Nemotron 3.5 Lightning Free",
  "muse-spark-1.2-contributor-free": "Muse Spark 1.2 Contributor Free",
};

const openCodePrivacy: Record<string, string> = {
  "big-pickle": "限时隐身模型；免费期数据可能用于改进模型。",
  "x-preview-f-free": "限时隐身模型；官方标示零数据保留且不用于训练。",
  "mimo-v2.5-free": "限时免费；免费期数据可能用于改进模型。",
  "hy3-free": "限时免费；免费期数据可能用于改进模型。",
  "nemotron-3-ultra-free": "试用端点；不要提交个人或机密数据，记录可能用于改进 NVIDIA 产品。",
  "nemotron-3.5-lightning-free": "试用端点；不要提交个人或机密数据，记录可能用于改进 NVIDIA 产品。",
  "muse-spark-1.2-contributor-free": "Contributor 档允许将提示词与输出用于后续模型训练。",
};

function titleFromId(id: string) {
  return id.split("/").pop()?.replace(/:free$/, "").split("-").map((part) => part ? `${part[0].toUpperCase()}${part.slice(1)}` : part).join(" ") ?? id;
}

export function parseOpenRouterFreeModels(payload: unknown): LiveFreeModel[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) return [];

  return ((payload as { data: OpenRouterModelRecord[] }).data)
    .filter((model) => {
      const outputs = Array.isArray(model.architecture?.output_modalities) ? model.architecture.output_modalities : [];
      return typeof model.id === "string"
        && model.pricing?.prompt === "0"
        && model.pricing?.completion === "0"
        && outputs.includes("text")
        && !model.id.startsWith("google/lyria-");
    })
    .map((model) => {
      const id = model.id as string;
      const name = typeof model.name === "string" ? model.name : titleFromId(id);
      const search = `${id} ${name} ${typeof model.description === "string" ? model.description : ""}`;
      return {
        id,
        name,
        contextLength: typeof model.context_length === "number" ? model.context_length : null,
        stealth: id.startsWith("stealth/") || /stealth/i.test(search),
        codingRelevant: /code|coding|agent|reason|glm|nemotron|inkling|laguna|stealth|dots/i.test(search),
      };
    })
    .sort((left, right) => Number(right.stealth) - Number(left.stealth) || Number(right.codingRelevant) - Number(left.codingRelevant) || left.name.localeCompare(right.name));
}

export function parseOpenCodeFreeModels(payload: unknown): LiveFreeModel[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { data?: unknown }).data)) return [];

  return (payload as { data: Array<{ id?: unknown }> }).data
    .filter((model) => typeof model.id === "string" && Object.hasOwn(openCodeNames, model.id))
    .map((model) => {
      const id = model.id as string;
      return {
        id,
        name: openCodeNames[id] ?? titleFromId(id),
        contextLength: null,
        stealth: id === "big-pickle" || id === "x-preview-f-free",
        codingRelevant: true,
        privacyNote: openCodePrivacy[id] ?? "限时免费，具体数据政策以 OpenCode Zen 当前说明为准。",
      };
    })
    .sort((left, right) => Number(right.stealth) - Number(left.stealth) || left.name.localeCompare(right.name));
}

export const fallbackOpenCodeFreeModels = parseOpenCodeFreeModels({ data: Object.keys(openCodeNames).map((id) => ({ id })) });
