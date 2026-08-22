import type { Metadata } from "next";
import { Ban, CircleGauge, FileCheck2, RefreshCw } from "lucide-react";

export const metadata: Metadata = { title: "方法与口径" };
const rules = [
  [
    FileCheck2,
    "事实与估计分层发布",
    "价格、额度、刷新规则和模型可用性必须有厂商官网证据。官网没有数字就写“官网未披露”；智能与使用强度可以引用独立评测或社区反馈，但必须标成估计、给出置信度，不能反填成官方事实。",
  ],
  [
    Ban,
    "不同 credit 不换算",
    "TRAE 的美元用量池、GitHub AI Credits、Kimi 共享池、Alibaba Token Plan Credits 都有自己的扣减逻辑。名称相似不代表可比较。",
  ],
  [
    CircleGauge,
    "多窗口同时保留",
    "5 小时滚动、日、周、月不是四选一。只要任一窗口会阻断使用，就全部展示，不能只挑最大的数字。",
  ],
  [
    RefreshCw,
    "自动扫描与人工核验分开",
    "机器人每天检测价格、额度、活动页是否失效或关键正文是否变化。检测到变化会创建审核 Issue，但事实只有人工确认后才更新核验日期；有明确结束时间的活动会自动退出当前列表。",
  ],
];
export default function MethodologyPage() {
  return (
    <div className="shell py-12 md:py-16">
      <div className="eyebrow">METHODOLOGY / V1</div>
      <h1 className="mt-3 max-w-4xl text-5xl font-black leading-[.95] tracking-[-.06em] md:text-8xl">
        比较之前，
        <br />
        先统一边界。
      </h1>
      <div className="mt-14 grid gap-px border hairline bg-[#d5d1c7] md:grid-cols-2">
        {rules.map(([Icon, title, body]) => {
          const I = Icon as typeof Ban;
          return (
            <article
              key={String(title)}
              className="min-h-64 bg-[var(--paper)] p-6"
            >
              <I size={25} />
              <h2 className="mt-12 text-xl font-black">{String(title)}</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-[#5f5b54]">
                {String(body)}
              </p>
            </article>
          );
        })}
      </div>
      <section className="mt-16 grid gap-8 border-t border-black pt-10 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="eyebrow">REFERENCE MAP</div>
          <h2 className="mt-2 text-2xl font-black">决策地图口径</h2>
        </div>
        <div className="space-y-5 text-sm leading-6 text-[#5f5b54]">
          <p>
            图中每个 Logo
            代表所选市场、币种和对象下，一个当前在售且官网明码的付费套餐。默认同时展示中国与国际市场；横轴使用月价对数刻度，避免高价套餐把低价密集区压扁。手机端使用一行一个产品的价格区间图，同一行的光环代表不同套餐。
          </p>
          <p>
            纵轴是 1–5 档的“Agent 能力估计”：综合当前可用模型、Agent 脚手架、独立
            Coding V3
            等相关信号，只保留宽档，不复制第三方分数。若产品不公开底层模型或缺少对应评测，就降低置信度；“相关模型评测”不能冒充产品实测。
          </p>
          <p>
            Logo 外五段不完整光环表示 1–5
            档“可用量强度”，亮起一段对应一档；低置信度估计降低光环透明度。它优先根据官网精确额度、相对倍率、刷新窗口和超额方式分档；官网没有绝对数字时只按厂商自己声明的相对档位估计。这个档位不把
            Kiro credit、AI Credit、请求或 token 相互换算。
          </p>
          <p>
            图不绘制帕累托边界，也不把价格、Agent 能力与用量合并成本站自创总分。免费套餐、纯按量 API、自定义报价和缺少可追溯估计的套餐不进入坐标，但仍保留在目录和详情页。
          </p>
        </div>
      </section>
      <section className="mt-16 grid gap-8 border-t border-black pt-10 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="eyebrow">MODEL ACCESS</div>
          <h2 className="mt-2 text-2xl font-black">模型接入分类</h2>
        </div>
        <div>
          <p className="max-w-3xl text-sm leading-6 text-[#5f5b54]">模型选择范围与 Agent 能力是两个维度。模型更多只代表选择自由度，不代表产品自身更会完成代码任务；模型路由平台也不能自动视作 Coding Agent。</p>
          <div className="mt-6 grid gap-px bg-[#d5d1c7] sm:grid-cols-2">
            {[
              ["固定模型", "厂商管理底层模型栈，用户不能自由切换。"],
              ["同族多模型", "同一厂商模型族中的不同版本或档位。"],
              ["精选多模型", "产品官方筛选并接入多个模型或供应商。"],
              ["开放模型 / BYOK", "Agent 外壳或工具允许用户自带供应商密钥。"],
              ["模型市场 / Router", "提供模型目录与路由，本身不等于具备 Agent 执行闭环。"],
            ].map(([title, body]) => <div key={title} className="bg-[var(--paper)] p-4"><h3 className="text-xs font-black">{title}</h3><p className="mt-2 text-xs leading-5 text-[#6f6b63]">{body}</p></div>)}
          </div>
        </div>
      </section>
      <section className="mt-16 grid gap-8 border-t border-black pt-10 lg:grid-cols-[300px_1fr]">
        <div>
          <div className="eyebrow">PRICE NORMALIZATION</div>
          <h2 className="mt-2 text-2xl font-black">价格标准化</h2>
        </div>
        <div className="space-y-5 text-sm leading-6 text-[#5f5b54]">
          <p>
            产品详情始终保留厂商原始币种。跨中国与国际市场绘图时，人民币与美元按国家外汇管理局公布、数据来自中国外汇交易中心的
            2026-08-20 中间价换算：1 USD = 6.7808
            CNY。折算值统一加“≈”，只用于位置参考，不代表信用卡、银行或应用商店实际结算价。
          </p>
          <p>
            年付只在官网明确总价或月折算时显示“年付折算月价”。促销价必须保存结束日期；历史方案标记为
            legacy，不参与默认筛选；同名套餐在中国版与国际版分别记录。
          </p>
          <p>
            API 表按每 100 万 token 展示 input、cached input、cache write 与
            output。长上下文阶梯、Batch 和工具调用费作为附注，不用单一“每百万
            token”掩盖条件差异。
          </p>
        </div>
      </section>
    </div>
  );
}
