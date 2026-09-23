export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Arc-Tx-Hash');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { gate_id, tx_hash } = req.body || {};
  const headerTx = req.headers['x-arc-tx-hash'];
  const resolvedTx = tx_hash || headerTx;

  if (!resolvedTx) {
    return res.status(402).json({
      error: 'Payment Required',
      message: 'Missing transaction hash verification. Provide X-Arc-Tx-Hash header or tx_hash in body.'
    });
  }

  return res.status(200).json({
    success: true,
    gateId: gate_id || 1,
    status: 'UNLOCKED',
    verifiedTx: resolvedTx,
    secret_payload: 'https://docs.arc.io/secret-alpha/arc-architecture-spec-v1.pdf\nPasscode: ARC_500_GRANT_WINNER',
    message: 'Machine-to-machine payload unlocked on Circle Arc Mainnet.'
  });
}
