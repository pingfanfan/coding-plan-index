const productLogos: Record<string, string> = {
  "openai-codex": "openai.svg",
  "claude-code": "claudecode-color.svg",
  "github-copilot": "githubcopilot.svg",
  cursor: "cursor.svg",
  windsurf: "windsurf.svg",
  "google-antigravity": "gemini-color.svg",
  grok: "grok.svg",
  trae: "trae-color.svg",
  "qwen-code": "qwen-color.svg",
  "glm-coding": "zhipu-color.svg",
  "kimi-code": "kimi.svg",
  deepseek: "deepseek-color.svg",
  openrouter: "openrouter.svg",
  opencode: "opencode.svg",
  kiro: "kiro-color.svg",
  "amazon-q-developer": "aws-color.svg",
  "jetbrains-ai": "junie-color.svg",
  "replit-agent": "replit-color.svg",
  devin: "devin-color.svg",
};

export function productLogo(productSlug: string) {
  const file = productLogos[productSlug];
  return file ? `/logos/${file}` : null;
}

export function shortProductName(name: string) {
  return name.split(" / ")[0].replace("ChatGPT / Codex", "Codex");
}
