/**
 * Paywall metadata endpoint for machine-to-machine (agentic) commerce.
 * Flat route (no path params) reached via the /api/gate/:id rewrite.
 * Returns HTTP 402 with X-Arc-* headers until payment is proven; the
 * decryption key is released exclusively by POST /api/unlock after
 * server-side receipt verification. Never serves plaintext secrets.
 */
export default function handler(req, res) {
  const gateId = parseInt(req.query?.id, 10) || 1;

  res.setHeader('X-Arc-Paywall-Protocol', 'ArcGate');
  res.setHeader('X-Arc-Chain-Id', '5042');
  res.setHeader('X-Arc-Gate-Id', String(gateId));
  res.setHeader('X-Arc-Price-USDC', gateId === 2 ? '0.25' : gateId === 3 ? '0.50' : '0.10');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Arc-Tx-Hash');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(402).json({
    status: 402,
    error: 'Payment Required',
    gateId,
    chainId: 5042,
    priceUsdc: gateId === 2 ? '0.25' : gateId === 3 ? '0.50' : '0.10',
    message:
      'Pay the access fee on Arc Mainnet via the ArcPaywall contract, then POST the resulting tx hash to /api/unlock to obtain the decryption key.',
    unlockEndpoint: '/api/unlock',
  });
}
