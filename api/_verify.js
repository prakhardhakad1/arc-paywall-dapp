import { createClient } from '@libsql/client';
import { Interface, Contract, JsonRpcProvider, id, toUtf8Bytes } from 'ethers';

export const RPC_URL = process.env.ARC_RPC_URL || 'https://rpc.mainnet.arc.io';
export const CONTRACT_ADDRESS = (process.env.ARC_PAYWALL_ADDRESS || '').toLowerCase();

export const IFACE = new Interface([
  'function unlockGate(uint256 gateId)',
  'function createGate(string title, string description, string secretPayload, uint256 priceUsdcWei) returns (uint256)',
  'event GateCreated(uint256 indexed id, address indexed creator, string title, uint256 priceUsdcWei, uint256 timestamp)',
]);

export const SELECTORS = {
  unlockGate: id('unlockGate(uint256)').slice(0, 10),
  createGate: id('createGate(string,string,string,uint256)').slice(0, 10),
};

async function rpc(method, params) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || 'RPC error');
  return json.result;
}

/**
 * Verify a transaction receipt on Arc Mainnet: successful, sent to the ArcPaywall
 * contract, and calling the expected function. Returns parsed call info.
 */
export async function verifyTx(txHash, selector) {
  if (!CONTRACT_ADDRESS) {
    const err = new Error('Key escrow not configured on server');
    err.status = 503;
    throw err;
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash || '')) {
    const err = new Error('Malformed transaction hash');
    err.status = 402;
    throw err;
  }

  const [receipt, tx] = await Promise.all([
    rpc('eth_getTransactionReceipt', [txHash]),
    rpc('eth_getTransactionByHash', [txHash]),
  ]);

  if (!receipt || !tx) {
    const err = new Error('Transaction not found on Arc Mainnet');
    err.status = 402;
    throw err;
  }
  if (receipt.status !== '0x1') {
    const err = new Error('Transaction reverted on-chain');
    err.status = 403;
    throw err;
  }
  if ((tx.to || '').toLowerCase() !== CONTRACT_ADDRESS) {
    const err = new Error('Transaction did not interact with the ArcPaywall contract');
    err.status = 403;
    throw err;
  }
  if (!(tx.input || '').startsWith(selector)) {
    const err = new Error('Transaction did not call the expected paywall function');
    err.status = 403;
    throw err;
  }

  return { from: (tx.from || '').toLowerCase(), input: tx.input, value: tx.value, receipt };
}

/** On-chain price of a gate, used to confirm the payment covered the fee. */
export async function getGatePrice(gateId) {
  const meta = await getGateMeta(gateId);
  return BigInt(meta.priceWei);
}

/**
 * Full gate metadata needed by the x402 agent-payment path: price, creator
 * (x402 payTo) and active flag. Throws status 404/503 like the other readers.
 */
const GATE_META_ABI = [
  'function getGate(uint256 gateId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 priceUsdcWei, uint256 unlockCount, uint256 createdAt, bool active, bool isUnlocked, string secretPayload))',
];
export async function getGateMeta(gateId) {
  if (!CONTRACT_ADDRESS) {
    const err = new Error('Contract address not configured on server');
    err.status = 503;
    throw err;
  }
  const provider = new JsonRpcProvider(RPC_URL);
  const contract = new Contract(CONTRACT_ADDRESS, GATE_META_ABI, provider);
  let gate;
  try {
    gate = await Promise.race([
      contract.getGate(gateId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('rpc timeout')), 8000)),
    ]);
  } catch (e) {
    if (e && (e.code === 'CALL_EXCEPTION' || /revert/i.test(e.message || ''))) {
      const err = new Error('Gate not found');
      err.status = 404;
      throw err;
    }
    const err = new Error('Could not read gate from Arc RPC');
    err.status = 503;
    throw err;
  }
  if (!gate || gate.id === undefined || Number(gate.id) === 0) {
    const err = new Error('Gate not found');
    err.status = 404;
    throw err;
  }
  return {
    priceWei: gate.priceUsdcWei.toString(),
    creator: String(gate.creator).toLowerCase(),
    active: Boolean(gate.active),
  };
}

export function parseGateIdArg(input) {
  return parseInt(input.slice(10, 74), 16);
}

export function parseGateCreated(receipt) {
  const topic = IFACE.getEvent('GateCreated').topicHash;
  const log = (receipt.logs || []).find((l) => (l.topics || [])[0] === topic);
  if (!log) return null;
  const parsed = IFACE.decodeEventLog('GateCreated', log.data, log.topics);
  return { gateId: Number(parsed.id), creator: parsed.creator.toLowerCase() };
}

let turso = null;
export function getTurso() {
  if (turso) return turso;
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) return null;
  turso = createClient({ url, authToken: token });
  return turso;
}

export async function getKey(gateId) {
  const db = getTurso();
  if (!db) {
    const err = new Error('Key escrow not configured on server');
    err.status = 503;
    throw err;
  }
  const row = await db.execute({
    sql: 'SELECT key_text FROM gate_keys WHERE gate_id = ?',
    args: [gateId],
  });
  return row.rows[0]?.key_text || null;
}

export async function putKey(gateId, keyText, creator) {
  const db = getTurso();
  if (!db) {
    const err = new Error('Key escrow not configured on server');
    err.status = 503;
    throw err;
  }
  await db.execute({
    sql: 'INSERT OR REPLACE INTO gate_keys (gate_id, key_text, creator, created_at) VALUES (?, ?, ?, ?)',
    args: [gateId, keyText, creator, Math.floor(Date.now() / 1000)],
  });
}

/**
 * Idempotent claim tracking. Each on-chain unlockGate transaction may be
 * claimed; the first valid claim records (tx_hash -> gate, buyer) and repeat
 * claims by the same payer return the same key with `replay: true` instead of
 * re-processing. A claim signed by anyone other than the tx sender is rejected
 * by the signature check in /api/unlock before this is consulted.
 * Returns { replay: boolean }. Never blocks a legitimate payer retry.
 */
export async function recordClaim(txHash, gateId, buyer) {
  const db = getTurso();
  if (!db) return { replay: false };
  await db.execute(`CREATE TABLE IF NOT EXISTS unlock_claims (
    tx_hash TEXT PRIMARY KEY,
    gate_id INTEGER NOT NULL,
    buyer TEXT NOT NULL,
    claimed_at INTEGER NOT NULL
  )`);
  // Atomic INSERT OR IGNORE: concurrent retries of the same claim cannot race
  // into a unique-key error. rowsAffected === 0 means the row already existed.
  const norm = String(txHash).toLowerCase();
  const inserted = await db.execute({
    sql: 'INSERT OR IGNORE INTO unlock_claims (tx_hash, gate_id, buyer, claimed_at) VALUES (?, ?, ?, ?)',
    args: [norm, gateId, String(buyer).toLowerCase(), Math.floor(Date.now() / 1000)],
  });
  return { replay: Number(inserted.rowsAffected || 0) === 0 };
}
export function sendError(res, err) {
  const status = err.status || 500;
  return res.status(status).json({ success: false, error: err.message || 'Internal error' });
}

/** Peek whether a claim id was already recorded (x402 nonce replay check). */
export async function hasClaim(claimId) {
  const db = getTurso();
  if (!db) return false;
  try {
    await db.execute(`CREATE TABLE IF NOT EXISTS unlock_claims (
      tx_hash TEXT PRIMARY KEY,
      gate_id INTEGER NOT NULL,
      buyer TEXT NOT NULL,
      claimed_at INTEGER NOT NULL
    )`);
    const row = await db.execute({
      sql: 'SELECT 1 FROM unlock_claims WHERE tx_hash = ? LIMIT 1',
      args: [String(claimId).toLowerCase()],
    });
    return row.rows.length > 0;
  } catch {
    return false;
  }
}
