import {
  SELECTORS,
  verifyTx,
  parseGateCreated,
  putKey,
  sendError,
} from './_verify.js';

/**
 * Escrow a gate's decryption key after verifying the creator's on-chain
 * createGate transaction. The key is stored server-side (Turso) and is only
 * released later by /api/unlock against a verified unlockGate receipt.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { key, create_tx_hash: txHash } = req.body || {};
    if (!key || typeof key !== 'string' || key.length < 32) {
      return res.status(400).json({ success: false, error: 'Missing gate key' });
    }

    const { receipt } = await verifyTx(txHash, SELECTORS.createGate);
    const created = parseGateCreated(receipt);
    if (!created) {
      return res.status(403).json({ success: false, error: 'No GateCreated event in receipt' });
    }

    await putKey(created.gateId, key, created.creator);
    return res.status(200).json({ success: true, gateId: created.gateId });
  } catch (err) {
    return sendError(res, err);
  }
}
