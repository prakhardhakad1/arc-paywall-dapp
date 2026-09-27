import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, RPC_URL, getKey, sendError } from './_verify.js';

const GATE_ABI = [
  'function getGate(uint256 gateId) view returns (tuple(uint256 id, address creator, string title, string description, uint256 priceUsdcWei, uint256 unlockCount, uint256 createdAt, bool active, bool isUnlocked, string secretPayload))',
];

export const creatorKeyMessage = (gateId) => `ArcGate creator key access for gate #${gateId}`;

/**
 * Returns a gate's decryption key to its own creator, proving ownership with a
 * wallet signature over a gate-specific message. No gas, no transaction.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { gate_id: gateId, address, signature } = req.body || {};
    if (!CONTRACT_ADDRESS) {
      const err = new Error('Key escrow not configured on server');
      err.status = 503;
      throw err;
    }
    if (!gateId || !address || !signature) {
      return res.status(400).json({ success: false, error: 'gate_id, address and signature are required' });
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, GATE_ABI, provider);
    const gate = await contract.getGate(gateId);

    if (!gate || gate.id === 0n) {
      return res.status(404).json({ success: false, error: 'Gate does not exist' });
    }
    if (gate.creator.toLowerCase() !== String(address).toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Signing wallet is not this gate’s creator' });
    }

    const recovered = ethers.verifyMessage(creatorKeyMessage(gateId), signature);
    if (recovered.toLowerCase() !== String(address).toLowerCase()) {
      return res.status(403).json({ success: false, error: 'Signature does not match the signing wallet' });
    }

    const key = await getKey(Number(gateId));
    if (!key) {
      return res.status(409).json({ success: false, error: 'No escrowed key for this gate' });
    }

    return res.status(200).json({ success: true, gateId: Number(gateId), key });
  } catch (err) {
    return sendError(res, err);
  }
}
