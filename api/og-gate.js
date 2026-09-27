export const config = { runtime: 'edge' };

const DEMO_TITLES = {
  1: 'Circle Arc Alpha: Developer Secrets & Architecture Blueprint',
  2: 'Private Telegram Alpha Channel: Crypto Quant Signals',
  3: 'Full-Stack Web3 Starter Kit (React + Solidity + Arc RPC)',
};

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Serves the SPA shell for /gate/:id with per-gate Open Graph tags so shared
 * gate links render rich preview cards in Slack, X, Discord, and Telegram.
 * Flat route (no path params) reached via the /gate/:id rewrite in vercel.json.
 */
export default async function handler(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '1';
  const base = `${url.protocol}//${url.host}`;

  const upstream = await fetch(`${base}/index.html`);
  let html = await upstream.text();

  // Crawlers honor the FIRST title/og occurrence, so strip the static ones
  // before injecting the per-gate set.
  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, '')
    .replace(/<meta[^>]*(?:property|name)="(?:og:|twitter:)[^>]*>/gi, '');

  const title = DEMO_TITLES[id]
    ? `${DEMO_TITLES[id]} — ArcGate Paywall`
    : `ArcGate Paywall #${id} — USDC Micro-Payment on Circle’s Arc Mainnet`;
  const description =
    'Unlock this paywalled resource with a 1-click native USDC micro-payment on Circle’s Arc Mainnet. Proof-gated AES-256-GCM key release.';

  const metas =
    `<title>${escapeHtml(title)}</title>` +
    `<meta property="og:title" content="${escapeHtml(title)}" />` +
    `<meta property="og:description" content="${escapeHtml(description)}" />` +
    `<meta property="og:url" content="${base}/gate/${id}" />` +
    `<meta property="og:type" content="article" />` +
    `<meta property="og:site_name" content="ArcGate" />` +
    `<meta property="og:image" content="${base}/og-cover.png" />` +
    `<meta name="twitter:card" content="summary_large_image" />` +
    `<meta name="twitter:title" content="${escapeHtml(title)}" />` +
    `<meta name="twitter:description" content="${escapeHtml(description)}" />` +
    `<meta name="twitter:image" content="${base}/og-cover.png" />`;

  html = html.replace('</head>', `${metas}</head>`);

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
