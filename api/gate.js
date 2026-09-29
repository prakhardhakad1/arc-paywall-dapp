/**
 * Paywall metadata endpoint for machine-to-machine (agentic) commerce.
 * Flat route (no path params) reached via the /api/gate/:id rewrite.
 * Returns HTTP 402 with everything an agent needs to pay: the contract to call,
 * the function, the exact price, and how to claim the decryption key.
 * The key itself is released only by POST /api/unlock after receipt verification.
 */
const CONTRACT = process.env.ARC_PAYWALL_ADDRESS || '';
const RPC = process.env.ARC_RPC_URL || 'https://rpc.mainnet.arc.io';

const PRICES = { 1: '0.10', 2: '0.25', 3: '0.50' };

export default function handler(req, res) {
  const gateId = parseInt(req.query?.id, 10) || 1;
  const priceUsdc = PRICES[gateId] || '0.10';

  res.setHeader('X-Arc-Paywall-Protocol', 'ArcGate');
  res.setHeader('X-Arc-Chain-Id', '5042');
  res.setHeader('X-Arc-Gate-Id', String(gateId));
  res.setHeader('X-Arc-Price-USDC', priceUsdc);
  res.setHeader('X-Arc-Contract', CONTRACT);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Arc-Tx-Hash');

  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(402).json({
    status: 402,
    error: 'Payment Required',
    gateId,
    priceUsdc,
    priceWei: '18-decimal native USDC units, e.g. 0.10 USDC = 100000000000000000',
    chainId: 5042,
    rpcUrl: RPC,
    contractAddress: CONTRACT || null,
    payment: {
      function: 'unlockGate(uint256 gateId)',
      args: [gateId],
      value: 'the priceWei above',
      note: 'Call the ArcPaywall contract on Arc Mainnet with the exact price as value. 99% is paid to the creator immediately, 1% is the protocol fee.',
    },
    claim: {
      endpoint: 'POST /api/unlock',
      body: { gate_id: gateId, tx_hash: '<your transaction hash>', buyer: '<your wallet address>' },
      alternativeHeader: 'X-Arc-Tx-Hash',
      note: 'The decryption key is released only after the server verifies your unlockGate receipt on Arc RPC (status, contract, function, gate id, sender and paid amount).',
    },
  });
}

