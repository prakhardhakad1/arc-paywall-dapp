import { ethers } from 'ethers';
import {
  SELECTORS,
  verifyTx,
  parseGateIdArg,
  getGatePrice,
  getKey,
  sendError,
} from './_verify.js';

/**
 * EIP-191 claim message a payer must sign to collect a gate's decryption key.
 * The signature is never published on-chain, so only the wallet that paid can
 * present it — replaying someone else's public tx hash is not enough.
 * Format must match the frontend signer in src/App.jsx and the agent snippets
 * in src/components/AgentTerminalCard.jsx.
 */
export const unlockClaimMessage = (gateId, txHash) =>
  `ArcGate unlock claim for gate #${gateId} (tx ${String(txHash).toLowerCase()})`;

/**
 * Release a gate's decryption key ONLY after verifying a real on-chain
 * unlockGate transaction on Arc Mainnet AND an EIP-191 signature proving the
 * requester controls the wallet that paid. Never serves plaintext secrets.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Arc-Tx-Hash');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { gate_id: gateId, buyer, signature } = req.body || {};
    const txHash = req.body?.tx_hash || req.headers['x-arc-tx-hash'];

    if (!signature || typeof signature !== 'string') {
      return res.status(401).json({
        success: false,
        error: 'Missing signature: the paying wallet must sign the unlock claim message (EIP-191).',
      });
    }

    const { from, input, value } = await verifyTx(txHash, SELECTORS.unlockGate);

    // Payer identity: the claim signature must recover to the transaction sender.
    // Without this, anyone could replay a public tx hash and read the key free.
    let recovered;
    try {
      recovered = ethers.verifyMessage(unlockClaimMessage(gateId, txHash), signature);
    } catch {
      return res.status(403).json({ success: false, error: 'Invalid claim signature.' });
    }
    if (recovered.toLowerCase() !== String(from).toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: 'Claim signature does not match the paying wallet.',
      });
    }

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

    // Defence in depth: the contract already enforces msg.value >= price, but we
    // re-check the paid amount against the on-chain price before releasing a key.
    const price = await getGatePrice(unlockedGateId);
    if (BigInt(value || 0) < price) {
      return res.status(403).json({
        success: false,
        error: 'Payment did not cover the gate price',
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
