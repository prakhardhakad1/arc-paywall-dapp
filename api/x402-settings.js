/**
 * Per-gate x402 opt-in settings. x402 agent payments are OFF by default for
 * every gate; only the gate's CREATOR can flip the toggle, proven by an
 * EIP-191 signature over the setting message.
 *
 * GET  /api/x402-settings?gate_ids=4,7   -> { settings: { "4": true, "7": false } }
 * POST /api/x402-settings                -> { gate_id, enabled, signature }
 */
import { ethers } from 'ethers';
import {
  setX402Enabled,
  getX402SettingsMap,
  x402SettingMessage,
} from './_x402.js';

const CONTRACT =
  process.env.ARC_PAYWALL_ADDRESS || '0x59a2f8f63cf6a2F918d8299a4B999341A1fC9620';
const RPC = process.env.ARC_RPC_URL || 'https://rpc.mainnet.arc.io';

const GATE_ABI = [
  'function getGate(uint256 gateId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 priceUsdcWei, uint256 unlockCount, uint256 createdAt, bool active, bool isUnlocked, string secretPayload))',
];

async function getGateCreator(gateId) {
  const provider = new ethers.JsonRpcProvider(RPC, 5042, { staticNetwork: true });
  const contract = new ethers.Contract(CONTRACT, GATE_ABI, provider);
  const gate = await Promise.race([
    contract.getGate(gateId),
    new Promise((_, reject) => setTimeout(() => reject(new Error('rpc timeout')), 8000)),
  ]);
  if (!gate || gate.id === undefined || Number(gate.id) === 0) return null;
  return String(gate.creator).toLowerCase();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const raw = String(req.query?.gate_ids || req.query?.gate_id || '');
    const ids = raw.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isInteger(n) && n > 0);
    if (ids.length === 0) {
      return res.status(400).json({ error: 'Provide gate_ids, e.g. ?gate_ids=4,7' });
    }
    const settings = await getX402SettingsMap(ids);
    return res.status(200).json({ settings });
  }

  if (req.method === 'POST') {
    const { gate_id: gateId, enabled, signature } = req.body || {};
    const id = parseInt(gateId, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, error: 'Invalid gate_id' });
    }
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'enabled must be a boolean' });
    }
    if (!signature || typeof signature !== 'string') {
      return res.status(401).json({ success: false, error: 'Missing signature' });
    }

    // Only the gate creator may change this gate's x402 setting.
    let creator;
    try {
      creator = await getGateCreator(id);
    } catch (e) {
      return res.status(503).json({ success: false, error: 'Could not read gate from Arc RPC' });
    }
    if (!creator) {
      return res.status(404).json({ success: false, error: 'Gate not found' });
    }
    let recovered;
    try {
      recovered = ethers.verifyMessage(x402SettingMessage(id, enabled), signature);
    } catch {
      return res.status(403).json({ success: false, error: 'Invalid signature' });
    }
    if (recovered.toLowerCase() !== creator) {
      return res.status(403).json({ success: false, error: 'Only the gate creator can change x402 settings' });
    }

    try {
      await setX402Enabled(id, enabled);
    } catch (e) {
      return res.status(e.status || 500).json({ success: false, error: e.message });
    }
    return res.status(200).json({ success: true, gateId: id, x402Enabled: enabled });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
