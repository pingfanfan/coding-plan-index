export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;",
  })[character]);
}

export function broadcastContent(offer, vendorName, sourceUrl, siteUrl = "https://cp.pingfan.me") {
  const title = `${vendorName}：${offer.benefit}`;
  const isEarly = offer.subscriberNotice === "early";
  const subject = `${isEarly ? "CP 提前提醒" : "CP 促销雷达"}｜${title}${isEarly ? "（待正式到账）" : ""}`;
  const eyebrow = isEarly ? "CP / EARLY SIGNAL" : offer.kind === "reset" ? "CP / RESET ALERT" : "CP / VERIFIED PROMO";
  const status = isEarly ? "<p style=\"margin:20px 0 0;padding:10px 12px;background:#e8e5de;font-size:12px;font-weight:800\">状态：待正式到账。公告已核验，但实际资格与到账时间仍以账户 Usage 页面为准。</p>" : "";
  const html = `<!doctype html><html lang="zh-CN"><body style="margin:0;background:#f3f1eb;color:#121212;font-family:Arial,'PingFang SC',sans-serif"><div style="max-width:620px;margin:0 auto;padding:44px 24px"><div style="font-size:12px;font-weight:800;letter-spacing:.12em">${eyebrow}</div><h1 style="font-size:34px;line-height:1.12;margin:20px 0 8px">${escapeHtml(offer.benefit)}</h1><p style="margin:0;font-size:16px;font-weight:800">${escapeHtml(offer.title)}</p><p style="font-size:14px;line-height:1.7;color:#5f5b54">${escapeHtml(offer.summary)}</p>${status}<div style="margin-top:24px;border:1px solid #121212;padding:18px"><p style="margin:0 0 10px"><strong>适用条件：</strong>${escapeHtml(offer.eligibility)}</p><p style="margin:0 0 10px"><strong>如何获得：</strong>${escapeHtml(offer.claimMethod)}</p><p style="margin:0"><strong>结束时间：</strong>${escapeHtml(offer.endLabel)}</p></div><p style="margin-top:24px"><a href="${escapeHtml(sourceUrl)}" style="display:inline-block;background:#121212;color:#fff;padding:13px 20px;text-decoration:none;font-weight:800">查看官方活动页 →</a></p><p style="margin-top:24px;font-size:12px;line-height:1.7;color:#77736b">本站于 ${escapeHtml(offer.verifiedAt)} 核验。活动资格、库存和结束时间以厂商页面或账户内显示为准。<a href="${siteUrl}/offers" style="color:#121212">查看 CP 全部活动</a></p><p style="margin-top:28px;font-size:11px;color:#77736b"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#77736b">退订促销提醒</a></p></div></body></html>`;
  return { subject, html };
}

export function digestContent(entries, vendors, siteUrl = "https://cp.pingfan.me") {
  if (entries.length === 1) {
    const entry = entries[0];
    return broadcastContent(entry.offer, vendors.find((v) => v.id === entry.offer.vendorId)?.name || entry.offer.vendorId, entry.source.url, siteUrl);
  }
  const hasEarly = entries.some(({ offer }) => offer.subscriberNotice === "early");
  const subject = `CP 福利汇总｜${entries.length} 条免费额度、折扣或加量${hasEarly ? "（含待到账预告）" : ""}`;
  const cards = entries.map(({ offer, source }) => `<section style="padding:20px 0;border-bottom:1px solid #ddd"><h2 style="font-size:19px;line-height:1.4;margin:0 0 12px">${escapeHtml(offer.title)}</h2><p><strong>${escapeHtml(offer.benefit)}</strong></p>${offer.subscriberNotice === "early" ? '<p style="font-weight:bold">状态：待正式到账。公告已核验，账户资格与实际到账仍待确认。</p>' : '<p>状态：官方规则已核验，具体资格以账户为准。</p>'}<p>${escapeHtml(offer.summary)}</p><p>适用条件：${escapeHtml(offer.eligibility)}</p><p>如何获得：${escapeHtml(offer.claimMethod)}</p><p>结束时间：${escapeHtml(offer.endLabel)}</p><p><a href="${escapeHtml(source.url)}" style="color:#244ddd">查看原始公告 →</a> · 核验日期 ${escapeHtml(offer.verifiedAt)}</p></section>`).join("");
  return { subject, html: `<!doctype html><html lang="zh-CN"><body style="margin:0;background:#f5f4f0;color:#171717;font:14px/1.7 Arial,'PingFang SC',sans-serif"><main style="max-width:600px;margin:0 auto;padding:28px 22px"><h1 style="font-size:24px">CP 福利提醒</h1><p>把值得关注的权益合在一封里。时间统一为北京时间；未知条件不作保证。</p>${cards}<p><a href="${escapeHtml(siteUrl)}/offers">查看 CP 全部活动</a></p><p style="font-size:12px">只发送免费额度、折扣和加量提醒。<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">退订促销提醒</a></p></main></body></html>` };
}
