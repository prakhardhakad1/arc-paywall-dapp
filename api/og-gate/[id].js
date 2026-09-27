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
 */
export default async function handler(request) {
  const url = new URL(request.url);
  const id = (url.pathname.match(/\/gate\/(\d+)/i) || [])[1] || '1';
  const base = `${url.protocol}//${url.host}`;

  const upstream = await fetch(`${base}/index.html`);
  let html = await upstream.text();

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
    `<meta property="og:image" content="${base}/favicon.svg" />` +
    `<meta name="twitter:card" content="summary" />`;

  html = html.replace('</head>', `${metas}</head>`);

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
