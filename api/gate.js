/**
 * Paywall metadata endpoint for machine-to-machine (agentic) commerce.
 * Flat route (no path params) reached via the /api/gate/:id rewrite.
 * Returns HTTP 402 with everything an agent needs to pay: the contract to call,
 * the function, the exact price (as an integer wei string), and how to claim
 * the decryption key.
 * The key itself is released only by POST /api/unlock after receipt verification.
 */
import { JsonRpcProvider, Contract } from 'ethers';
import { getX402Enabled, buildPaymentRequired, X402_NETWORK, X402_USDC_ASSET, weiToAtomicUnits } from './_x402.js';

const CONTRACT =
  process.env.ARC_PAYWALL_ADDRESS || '0x59a2f8f63cf6a2F918d8299a4B999341A1fC9620';
const RPC = process.env.ARC_RPC_URL || 'https://rpc.mainnet.arc.io';

// No hardcoded price fallbacks: advertising a stale price would let an agent
// overpay or underpay. If the on-chain read fails we fail closed with 503.

const GATE_ABI = [
  'function getGate(uint256 gateId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 priceUsdcWei, uint256 unlockCount, uint256 createdAt, bool active, bool isUnlocked, string secretPayload))',
];

function weiToUsdc(w) {
  const b = BigInt(w);
  const whole = b / 10n ** 18n;
  const frac = (b % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole.toString();
}

// Read the gate's live on-chain state. Returns:
//   { ok: true, priceWei, active, creator, title }  — gate exists
//   { ok: false, reason: 'not-found' } — no such gate (id 0 / revert)
//   { ok: false, reason: 'rpc-error' } — RPC unreachable or timed out
async function readGate(gateId) {
  try {
    const provider = new JsonRpcProvider(RPC, 5042, { staticNetwork: true });
    const contract = new Contract(CONTRACT, GATE_ABI, provider);
    const gate = await Promise.race([
      contract.getGate(gateId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('rpc timeout')), 5000)),
    ]);
    if (!gate || gate.id === undefined || Number(gate.id) === 0) {
      return { ok: false, reason: 'not-found' };
    }
    return {
      ok: true,
      priceWei: gate.priceUsdcWei.toString(),
      active: Boolean(gate.active),
      creator: String(gate.creator).toLowerCase(),
      title: String(gate.title || ''),
    };
  } catch (e) {
    // The contract reverts for out-of-range gate ids (CALL_EXCEPTION);
    // anything else is an RPC/network failure.
    if (e && (e.code === 'CALL_EXCEPTION' || /revert/i.test(e.message || ''))) {
      return { ok: false, reason: 'not-found' };
    }
    return { ok: false, reason: 'rpc-error' };
  }
}

export default async function handler(req, res) {
  res.setHeader('X-Arc-Paywall-Protocol', 'ArcGate');
  res.setHeader('X-Arc-Chain-Id', '5042');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Arc-Tx-Hash, PAYMENT-SIGNATURE');
  res.setHeader('Access-Control-Expose-Headers', 'PAYMENT-REQUIRED, PAYMENT-RESPONSE');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const gateId = parseInt(req.query?.id, 10);
  if (!Number.isInteger(gateId) || gateId < 1) {
    return res.status(400).json({ status: 400, error: 'Invalid gate id', gateId: req.query?.id ?? null });
  }
  res.setHeader('X-Arc-Gate-Id', String(gateId));

  let gate = await readGate(gateId);
  if (!gate.ok) {
    if (gate.reason === 'rpc-error') {
      // Fail closed: never advertise a price we could not verify on-chain.
      return res.status(503).json({ status: 503, error: 'Price oracle unavailable — could not read gate from Arc RPC. Retry shortly.', gateId });
    }
    return res.status(404).json({ status: 404, error: 'Gate not found', gateId });
  }
  if (!gate.active) {
    // Paused gates are hidden from the agentic surface: no price, no claim path.
    return res.status(404).json({ status: 404, error: 'Gate not found or paused', gateId });
  }
  const priceWei = gate.priceWei;
  const priceSource = 'on-chain';
  const priceUsdc = weiToUsdc(priceWei);
  res.setHeader('X-Arc-Price-USDC', priceUsdc);
  res.setHeader('X-Arc-Price-Wei', priceWei);
  res.setHeader('X-Arc-Contract', CONTRACT);

  // x402 agent payments: strictly opt-in per gate, OFF by default. When the
  // creator enables it, the same 402 ALSO carries a standard x402 v2
  // PAYMENT-REQUIRED header so any x402-compatible AI agent can pay
  // programmatically. The JSON body below is unchanged (humans / our UI).
  // Note: x402 settlement goes buyer -> creator directly via the Arc native
  // USDC precompile; it does not flow through the ArcPaywall contract, so the
  // 1% protocol fee does not apply to x402 sales.
  const x402Enabled = await getX402Enabled(gateId);
  let paymentRequiredHeader = null;
  if (x402Enabled) {
    const unlockUrl = 'https://arc-paywall-dapp.vercel.app/api/unlock';
    paymentRequiredHeader = buildPaymentRequired({
      gateId,
      priceWei,
      creator: gate.creator,
      title: gate.title,
      unlockUrl,
    });
    res.setHeader('PAYMENT-REQUIRED', paymentRequiredHeader);
    res.setHeader('X-Arc-X402', 'enabled');
  }

  return res.status(402).json({
    status: 402,
    error: 'Payment Required',
    gateId,
    priceUsdc,
    priceWei,
    priceSource,
    chainId: 5042,
    rpcUrl: RPC,
    contractAddress: CONTRACT,
    x402: x402Enabled
      ? {
          enabled: true,
          x402Version: 2,
          network: X402_NETWORK,
          scheme: 'exact',
          asset: X402_USDC_ASSET,
          amount: weiToAtomicUnits(priceWei),
          payTo: gate.creator,
          payHeader: 'PAYMENT-SIGNATURE',
          responseHeader: 'PAYMENT-RESPONSE',
          note: 'This gate accepts x402 v2 agent payments: sign EIP-3009 transferWithAuthorization against the Arc native-USDC precompile and retry POST /api/unlock with the base64 PaymentPayload in the PAYMENT-SIGNATURE header. Settlement goes buyer -> creator directly (no protocol fee on x402 sales).',
        }
      : { enabled: false },
    payment: {
      function: 'unlockGate(uint256 gateId)',
      args: [gateId],
      value: priceWei,
      note: 'Call the ArcPaywall contract on Arc Mainnet with the exact priceWei as msg.value (native USDC, 18 decimals). 99% is paid to the creator immediately, 1% is the protocol fee.',
    },
    claim: {
      endpoint: 'POST /api/unlock',
      body: {
        gate_id: gateId,
        tx_hash: '<your unlockGate transaction hash>',
        signature: '<EIP-191 personal_sign of "ArcGate unlock claim for gate #<gate_id> (tx <tx_hash lowercased>)" by the paying wallet>',
      },
      alternativeHeader: 'X-Arc-Tx-Hash',
      note: 'The decryption key is released only after the server verifies your unlockGate receipt on Arc RPC (status, contract, function, gate id, sender and paid amount) AND an EIP-191 signature proving the requester is the paying wallet. The signature is never published on-chain, so a public tx hash alone cannot claim the key.',
    },
  });
}
