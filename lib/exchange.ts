export const usdCnyReference = {
  base: "USD",
  quote: "CNY",
  rate: 6.7808,
  effectiveAt: "2026-08-20",
  sourceName: "国家外汇管理局 / 中国外汇交易中心",
  sourceUrl: "https://www.safe.gov.cn/AppStructured/hlw/RMBQuery.do",
} as const;

export function convertCurrency(value: number, from: string, to: string) {
  if (from === to) return value;
  if (from === "USD" && to === "CNY") return value * usdCnyReference.rate;
  if (from === "CNY" && to === "USD") return value / usdCnyReference.rate;
  return null;
}

export function roundCurrency(value: number, currency: string) {
  const decimals = currency === "CNY" && value >= 100 ? 0 : 2;
  return Number(value.toFixed(decimals));
}
