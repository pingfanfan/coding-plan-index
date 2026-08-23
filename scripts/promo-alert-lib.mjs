const ALERT_KINDS = new Set(["discount", "token_gift", "usage_boost", "reset"]);

export function isBroadcastEligible(offer) {
  return offer?.verification === "verified" && ALERT_KINDS.has(offer.kind);
}

export function addedOffers(previous, current) {
  const previousById = new Map((previous?.offers || []).map((offer) => [offer.id, offer]));
  return (current?.offers || []).filter((offer) => {
    if (!isBroadcastEligible(offer)) return false;
    const previousOffer = previousById.get(offer.id);
    return !previousOffer || !isBroadcastEligible(previousOffer);
  });
}

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
  const subject = `CP 促销雷达｜${title}`;
  const eyebrow = offer.kind === "reset" ? "CP / RESET ALERT" : "CP / VERIFIED PROMO";
  const html = `<!doctype html><html lang="zh-CN"><body style="margin:0;background:#f3f1eb;color:#121212;font-family:Arial,'PingFang SC',sans-serif"><div style="max-width:620px;margin:0 auto;padding:44px 24px"><div style="font-size:12px;font-weight:800;letter-spacing:.12em">${eyebrow}</div><h1 style="font-size:34px;line-height:1.12;margin:20px 0 8px">${escapeHtml(offer.benefit)}</h1><p style="margin:0;font-size:16px;font-weight:800">${escapeHtml(offer.title)}</p><p style="font-size:14px;line-height:1.7;color:#5f5b54">${escapeHtml(offer.summary)}</p><div style="margin-top:24px;border:1px solid #121212;padding:18px"><p style="margin:0 0 10px"><strong>适用条件：</strong>${escapeHtml(offer.eligibility)}</p><p style="margin:0 0 10px"><strong>如何获得：</strong>${escapeHtml(offer.claimMethod)}</p><p style="margin:0"><strong>结束时间：</strong>${escapeHtml(offer.endLabel)}</p></div><p style="margin-top:24px"><a href="${escapeHtml(sourceUrl)}" style="display:inline-block;background:#121212;color:#fff;padding:13px 20px;text-decoration:none;font-weight:800">查看官方活动页 →</a></p><p style="margin-top:24px;font-size:12px;line-height:1.7;color:#77736b">本站于 ${escapeHtml(offer.verifiedAt)} 核验。活动资格、库存和结束时间以厂商页面或账户内显示为准。<a href="${siteUrl}/offers" style="color:#121212">查看 CP 全部活动</a></p><p style="margin-top:28px;font-size:11px;color:#77736b"><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#77736b">退订促销提醒</a></p></div></body></html>`;
  return { subject, html };
}
