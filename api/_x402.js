/**
 * x402 (v2) agent-payment helpers for ArcGate.
 *
 * x402 is Coinbase's open standard for HTTP 402 stablecoin payments. When a
 * gate creator opts in (per-gate toggle, OFF by default), /api/gate answers
 * with a standard `PAYMENT-REQUIRED` header so ANY x402-compatible AI agent
 * can pay the gate programmatically — no human clicks, no custom integration.
 *
 * Arc specifics (the whole reason this needed research):
 * - Network is `eip155:5042` (Arc mainnet).
 * - USDC is Arc's NATIVE token, but Arc exposes it through an ERC-20
 *   precompile at 0x3600...0000 (6 decimals) that implements EIP-3009
 *   `transferWithAuthorization`. So x402's EVM `exact` scheme works unchanged:
 *   the agent signs EIP-3009 against the precompile and spends native USDC.
 * - Amounts are 6-decimal atomic units: on-chain priceWei (18 decimals) is
 *   divided by 10^12. 0.10 USDC -> "100000".
 * - Settlement goes buyer -> creator DIRECTLY via the precompile. It does NOT
 *   flow through the ArcPaywall contract, so the 1% protocol fee does not
 *   apply to x402 sales. That is inherent to the x402 model (payTo = seller).
 *
 * Verification/settlement are delegated to a facilitator service:
 *   X402_FACILITATOR_URL (default: Circle's hosted x402 facilitator)
 *   X402_FACILITATOR_API_KEY (optional)
 * If no facilitator is reachable the payment path fails closed with 502 —
 * never serve content on an unverified payment.
 */
import { getTurso } from './_verify.js';

export const X402_VERSION = 2;
export const X402_NETWORK = 'eip155:5042';
export const X402_CHAIN_ID = 5042;
// Arc native-USDC ERC-20 precompile (6 decimals). EIP-3009 is implemented here.
export const X402_USDC_ASSET = '0x3600000000000000000000000000000000000000';
export const X402_SCHEME = 'exact';
export const X402_MAX_TIMEOUT_SECONDS = 300;

const DEFAULT_FACILITATOR_URL = 'https://api.circle.com/v1/facilitator/x402';
export function facilitatorUrl() {
  return process.env.X402_FACILITATOR_URL || DEFAULT_FACILITATOR_URL;
}
function facilitatorHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (process.env.X402_FACILITATOR_API_KEY) {
    h['Authorization'] = `Bearer ${process.env.X402_FACILITATOR_API_KEY}`;
  }
  return h;
}

/**
 * Convert an on-chain 18-decimal wei price to x402 6-decimal atomic units.
 * Arc's native view is 18 decimals; the USDC precompile counts 6.
 */
export function weiToAtomicUnits(priceWei) {
  const units = BigInt(priceWei) / 10n ** 12n;
  return units.toString();
}

/** EIP-191 message a creator signs to flip their gate's x402 toggle. */
export const x402SettingMessage = (gateId, enabled) =>
  `ArcGate x402: ${enabled ? 'enable' : 'disable'} agent payments for gate #${gateId}`;

// ---------------------------------------------------------------------------
// Per-gate opt-in storage (Turso; OFF by default for every gate)
// ---------------------------------------------------------------------------

async function ensureSettingsTable(db) {
  await db.execute(`CREATE TABLE IF NOT EXISTS gate_x402_settings (
    gate_id INTEGER PRIMARY KEY,
    enabled INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`);
}

export async function getX402Enabled(gateId) {
  const db = getTurso();
  if (!db) return false;
  try {
    await ensureSettingsTable(db);
    const row = await db.execute({
      sql: 'SELECT enabled FROM gate_x402_settings WHERE gate_id = ?',
      args: [Number(gateId)],
    });
    return Number(row.rows[0]?.enabled || 0) === 1;
  } catch {
    return false; // fail closed: unknown setting => x402 off
  }
}

export async function setX402Enabled(gateId, enabled) {
  const db = getTurso();
  if (!db) {
    const err = new Error('x402 settings store not configured on server');
    err.status = 503;
    throw err;
  }
  await ensureSettingsTable(db);
  await db.execute({
    sql: 'INSERT OR REPLACE INTO gate_x402_settings (gate_id, enabled, updated_at) VALUES (?, ?, ?)',
    args: [Number(gateId), enabled ? 1 : 0, Math.floor(Date.now() / 1000)],
  });
}

export async function getX402SettingsMap(gateIds) {
  const db = getTurso();
  const out = {};
  for (const id of gateIds) out[String(id)] = false;
  if (!db || gateIds.length === 0) return out;
  try {
    await ensureSettingsTable(db);
    const placeholders = gateIds.map(() => '?').join(',');
    const row = await db.execute({
      sql: `SELECT gate_id, enabled FROM gate_x402_settings WHERE gate_id IN (${placeholders})`,
      args: gateIds.map(Number),
    });
    for (const r of row.rows) out[String(r.gate_id)] = Number(r.enabled) === 1;
  } catch {
    // fail closed: leave defaults (false)
  }
  return out;
}

// ---------------------------------------------------------------------------
// x402 v2 wire format
// ---------------------------------------------------------------------------

const b64encode = (obj) => Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');
const b64decode = (s) => JSON.parse(Buffer.from(String(s), 'base64').toString('utf8'));

/**
 * Build the base64 PaymentRequired value for the PAYMENT-REQUIRED header.
 */
export function buildPaymentRequired({ gateId, priceWei, creator, title, unlockUrl }) {
  const amount = weiToAtomicUnits(priceWei);
  return b64encode({
    x402Version: X402_VERSION,
    resource: {
      url: unlockUrl,
      description: title
        ? `ArcGate gate #${gateId}: ${title}`
        : `ArcGate gate #${gateId} unlock`,
      mimeType: 'application/json',
    },
    accepts: [
      {
        scheme: X402_SCHEME,
        network: X402_NETWORK,
        amount,
        asset: X402_USDC_ASSET,
        payTo: creator,
        maxTimeoutSeconds: X402_MAX_TIMEOUT_SECONDS,
        extra: { name: 'USDC', version: '2' },
      },
    ],
  });
}

/**
 * Parse the base64 PaymentPayload from the PAYMENT-SIGNATURE header.
 * Throws with status 402 on malformed input.
 */
export function parsePaymentSignature(headerValue) {
  if (!headerValue || typeof headerValue !== 'string') {
    const err = new Error('Missing PAYMENT-SIGNATURE header');
    err.status = 402;
    throw err;
  }
  let payload;
  try {
    payload = b64decode(headerValue.trim());
  } catch {
    const err = new Error('PAYMENT-SIGNATURE is not valid base64 JSON');
    err.status = 402;
    throw err;
  }
  if (payload.x402Version !== X402_VERSION) {
    const err = new Error(`Unsupported x402Version (expected ${X402_VERSION})`);
    err.status = 402;
    throw err;
  }
  if (payload.network !== X402_NETWORK || payload.scheme !== X402_SCHEME) {
    const err = new Error(`Unsupported x402 network/scheme (expected ${X402_SCHEME} on ${X402_NETWORK})`);
    err.status = 402;
    throw err;
  }
  const auth = payload.payload?.authorization;
  const sig = payload.payload?.signature;
  if (!auth || !sig) {
    const err = new Error('PAYMENT-SIGNATURE missing EIP-3009 authorization payload');
    err.status = 402;
    throw err;
  }
  return payload;
}

/**
 * Sanity-check the payment authorization against the gate's quote BEFORE
 * asking the facilitator to verify. Throws with status 402 on mismatch.
 */
export function checkAuthorizationMatchesQuote(payload, { amount, payTo, asset }) {
  const auth = payload.payload.authorization;
  const now = Math.floor(Date.now() / 1000);
  const problems = [];
  if (String(auth.to).toLowerCase() !== String(payTo).toLowerCase()) problems.push('payee mismatch');
  if (BigInt(auth.value) < BigInt(amount)) problems.push('amount below gate price');
  if (auth.validAfter !== undefined && Number(auth.validAfter) > now) problems.push('authorization not yet valid');
  if (auth.validBefore !== undefined && Number(auth.validBefore) < now) problems.push('authorization expired');
  if (asset && auth.asset && String(auth.asset).toLowerCase() !== String(asset).toLowerCase()) {
    problems.push('asset mismatch');
  }
  if (problems.length > 0) {
    const err = new Error(`x402 payment does not match gate quote: ${problems.join(', ')}`);
    err.status = 402;
    throw err;
  }
  return {
    from: String(auth.from).toLowerCase(),
    nonce: String(auth.nonce),
    value: String(auth.value),
  };
}

async function facilitatorPost(path, body) {
  const url = facilitatorUrl().replace(/\/$/, '') + path;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: facilitatorHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    const err = new Error(`x402 facilitator unreachable (${e.message || e})`);
    err.status = 502;
    throw err;
  }
  let json = null;
  try {
    json = await res.json();
  } catch {
    // fall through; handled below
  }
  if (!res.ok) {
    const err = new Error(`x402 facilitator error ${res.status}: ${(json && (json.error || json.message)) || res.statusText}`);
    err.status = 502;
    throw err;
  }
  return json || {};
}

/** Ask the facilitator to verify the signed payment. Returns the raw result. */
export async function facilitatorVerify(paymentPayload) {
  const body = {
    x402Version: X402_VERSION,
    scheme: X402_SCHEME,
    network: X402_NETWORK,
    payload: paymentPayload.payload,
  };
  return facilitatorPost('/verify', body);
}

/** Ask the facilitator to settle (submit transferWithAuthorization on Arc). */
export async function facilitatorSettle(paymentPayload) {
  const body = {
    x402Version: X402_VERSION,
    scheme: X402_SCHEME,
    network: X402_NETWORK,
    payload: paymentPayload.payload,
  };
  return facilitatorPost('/settle', body);
}

export function facilitatorResultValid(result) {
  if (!result || typeof result !== 'object') return false;
  if (typeof result.isValid === 'boolean') return result.isValid;
  if (typeof result.valid === 'boolean') return result.valid;
  if (typeof result.success === 'boolean') return result.success;
  return false;
}

/** Build the base64 SettlementResponse for the PAYMENT-RESPONSE header. */
export function buildPaymentResponse({ success, transaction, payer }) {
  return b64encode({
    success: Boolean(success),
    transaction: transaction || null,
    network: X402_NETWORK,
    payer: payer || null,
  });
}
