import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "node_modules", "@lobehub", "icons-static-svg", "icons");
const destination = path.join(root, "public", "logos");

const logos = [
  "openai.svg",
  "claudecode-color.svg",
  "githubcopilot.svg",
  "cursor.svg",
  "windsurf.svg",
  "gemini-color.svg",
  "grok.svg",
  "trae-color.svg",
  "qwen-color.svg",
  "zhipu-color.svg",
  "kimi.svg",
  "deepseek-color.svg",
  "openrouter.svg",
  "opencode.svg",
  "kiro-color.svg",
  "aws-color.svg",
  "junie-color.svg",
  "replit-color.svg",
  "devin-color.svg",
];

await mkdir(destination, { recursive: true });
await Promise.all(logos.map((name) => copyFile(path.join(source, name), path.join(destination, name))));
