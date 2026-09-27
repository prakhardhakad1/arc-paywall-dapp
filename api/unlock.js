import {
  SELECTORS,
  verifyTx,
  parseGateIdArg,
  getKey,
  sendError,
} from './_verify.js';

/**
 * Release a gate's decryption key ONLY after verifying a real on-chain
 * unlockGate transaction on Arc Mainnet. Never serves plaintext secrets.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Arc-Tx-Hash');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { gate_id: gateId, buyer } = req.body || {};
    const txHash = req.body?.tx_hash || req.headers['x-arc-tx-hash'];

    const { from, input } = await verifyTx(txHash, SELECTORS.unlockGate);

    const unlockedGateId = parseGateIdArg(input);
    if (Number(gateId) !== unlockedGateId) {
      return res.status(403).json({
        success: false,
        error: `Transaction unlocked gate #${unlockedGateId}, not gate #${gateId}`,
      });
    }
    if (buyer && from !== String(buyer).toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Transaction sender does not match the requesting buyer wallet',
      });
    }

    const key = await getKey(unlockedGateId);
    if (!key) {
      return res.status(409).json({
        success: false,
        error: 'No escrowed key for this gate. The creator must escrow the gate key at creation time.',
      });
    }

    return res.status(200).json({ success: true, gateId: unlockedGateId, key });
  } catch (err) {
    return sendError(res, err);
  }
}
