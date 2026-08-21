import type { ModelAccess } from "@/lib/schema";

export const productRoleLabels: Record<ModelAccess["role"], string> = {
  native_agent: "原生 Coding Agent",
  agent_shell: "Agent 外壳",
  model_router: "模型路由平台",
  chat_api: "Chat / API",
};

export const modelAccessLabels: Record<ModelAccess["mode"], string> = {
  fixed: "固定模型",
  same_family: "同族多模型",
  curated_multi: "精选多模型",
  open_byok: "开放模型 / BYOK",
  marketplace: "模型市场 / Router",
};

export const modelRoutingLabels: Record<ModelAccess["routing"], string> = {
  fixed: "不可切换",
  manual: "手动选择",
  automatic: "自动路由",
  both: "手动选择 + 自动路由",
};

export const modelBillingLabels: Record<ModelAccess["billing"], string> = {
  included: "套餐内含",
  metered: "按模型用量计费",
  mixed: "套餐额度 + 按量 / 加量",
};

export function modelAccessBadge(access: ModelAccess) {
  return access.role === "model_router" ? "路由平台 · 模型市场" : modelAccessLabels[access.mode];
}
