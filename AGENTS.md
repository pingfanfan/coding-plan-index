<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## CP 消息发布规则

修改价格、免费模型、活动、最新消息或邮件流程前，完整阅读 `docs/publication-policy.md`。
项目所有者已授权按该范围核验、更新网站并通过既有订阅主题发送高价值福利提醒，不逐条重复询问；不包含社交发布、购买服务或新增联系人。
官网普通改价只更新网站；免费额度/折扣/加量走汇总；负责人预告必须标注待到账；社区线索先核验。保留稳定事件 ID，同一次权益不重发。
不得绕过 `scripts/send-offer-alert.mjs` 直接群发，不得重置 `notification-state` 发送历史，不得把测试邮件发给真实订阅者。
