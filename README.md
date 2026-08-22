<img src="./public/cp-mark.svg" width="64" height="64" alt="Coding Plan Index Logo">

# Coding Plan Index

[![Website](https://img.shields.io/badge/website-cp.pingfan.me-000000)](https://cp.pingfan.me)
[![Deploy](https://github.com/pingfanfan/coding-plan-index/actions/workflows/deploy-cloudflare.yml/badge.svg)](https://github.com/pingfanfan/coding-plan-index/actions/workflows/deploy-cloudflare.yml)
[![Daily source check](https://github.com/pingfanfan/coding-plan-index/actions/workflows/daily-source-check.yml/badge.svg)](https://github.com/pingfanfan/coding-plan-index/actions/workflows/daily-source-check.yml)
[![License](https://img.shields.io/badge/code-Apache--2.0-2b59ff)](./LICENSE)
[![Data](https://img.shields.io/badge/data-CC%20BY%204.0-dfff00)](./DATA_LICENSE.md)

基于厂商官网的 AI 编程套餐、额度窗口与 API 价格数据库。当前收录 19 个主流产品家族，并包含独立 AI 视频品类。

生产地址：<https://cp.pingfan.me>

## 项目内容

- AI 编程订阅、团队套餐、API 和 AI 视频生成的官网价格数据库。
- 赠送 Token、临时扩容、Reset 与限时折扣的独立活动栏目。
- 最多四项并排比较，以及面向价格、Agent 能力和可用量的决策视图。
- 所有事实记录官方来源与最后核验日期。
- GitHub Actions 每日检查官方页面的可访问性和正文变化，只创建审核 Issue，不自动改写事实；每日静态构建会让已到期活动自动退出当前列表。

## 本地运行

```bash
npm install
npm run dev
```

数据位于 `data/*.yml`，构建时通过 Zod 校验。常用命令：

```bash
npm test
npm run lint
npm run build
npm run check:sources
```

## Cloudflare Pages 部署

本站全部页面在构建时静态生成，生产构建输出到 `out/`。每次向 `main` 分支推送代码，以及每日 UTC 03:47，`.github/workflows/deploy-cloudflare.yml` 会自动执行依赖安装、lint、测试和构建；全部通过后才发布到现有 Cloudflare Pages 项目 `coding-plan-index`，生产域名保持为 `cp.pingfan.me`。

自动发布需要在 GitHub Actions 仓库 Secrets 中配置：

- `CLOUDFLARE_ACCOUNT_ID`：Cloudflare 账户 ID。
- `CLOUDFLARE_API_TOKEN`：仅授权目标账户 Cloudflare Pages 写入权限的 API Token。

也可以在 GitHub Actions 页面手动触发 `Deploy to Cloudflare Pages`。本地预览或紧急手动发布仍可使用：

```bash
npm run build
npm run preview:cloudflare
npm run deploy:cloudflare
```

推荐自定义域名为 `cp.pingfan.me`。当前 `pingfan.me` 的权威 DNS 在 Namecheap，因此绑定步骤是：先在 Cloudflare Pages 项目中添加 `cp.pingfan.me`，再按 Cloudflare 给出的目标在 Namecheap 新增 `cp` CNAME。不要改动根域名和 `www` 的现有记录。

## 每日更新机制

`.github/workflows/daily-source-check.yml` 每天 UTC 02:17 检查全部来源：

- 官方价格、额度、API、活动和政策页检查 HTTP 状态、跳转目标和去噪正文指纹。
- 第三方评测页只检查可访问性，不抓取或缓存榜单正文。
- 指纹状态通过 GitHub Actions cache 在每日运行之间保存。
- 检测到变化或失效时，创建或更新带 `source-change` 标签的审核 Issue。
- 自动检查不会改写 YAML；人工核验官方页面后才更新事实和 `verifiedAt`。
- `data/offers.yml` 中有明确结束时间的活动，在每日构建时自动归入“最近结束”。

## 数据原则

- 缺少官方来源的价格或额度不发布。
- 厂商未披露数字时显示“官网未披露”，不推算。
- 不同厂商的自定义 credit 不直接换算。
- 历史套餐与当前套餐分开保存。
- Artificial Analysis 与 llm2014 只提供方法摘要和外链。

## 参与贡献

发现厂商改价、额度调整或来源失效，可以使用 [Official source correction](https://github.com/pingfanfan/coding-plan-index/issues/new?template=source-correction.yml) 模板提交。详细规则见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 开源许可

- 网站代码： [Apache License 2.0](./LICENSE)
- 本站原创的数据结构、整理与说明： [CC BY 4.0](./DATA_LICENSE.md)
- 厂商名称与 Logo：归各自权利人所有，不包含在上述授权中，详见 [NOTICE](./NOTICE)
