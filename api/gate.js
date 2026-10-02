/**
 * Paywall metadata endpoint for machine-to-machine (agentic) commerce.
 * Flat route (no path params) reached via the /api/gate/:id rewrite.
 * Returns HTTP 402 with everything an agent needs to pay: the contract to call,
 * the function, the exact price (as an integer wei string), and how to claim
 * the decryption key.
 * The key itself is released only by POST /api/unlock after receipt verification.
 */
import { JsonRpcProvider, Contract } from 'ethers';

const CONTRACT =
  process.env.ARC_PAYWALL_ADDRESS || '0x59a2f8f63cf6a2F918d8299a4B999341A1fC9620';
const RPC = process.env.ARC_RPC_URL || 'https://rpc.mainnet.arc.io';

// Fallback prices (USDC) used only if the on-chain read fails.
const FALLBACK_PRICES = { 1: '0.10', 2: '0.25', 3: '0.50' };

const GATE_ABI = [
  'function getGate(uint256 gateId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 priceUsdcWei, uint256 unlockCount, uint256 createdAt, bool active, bool isUnlocked, string secretPayload))',
];

function usdcToWei(s) {
  const [w = '0', f = ''] = String(s).split('.');
  return (BigInt(w) * 10n ** 18n + BigInt((f + '0'.repeat(18)).slice(0, 18))).toString();
}

function weiToUsdc(w) {
  const b = BigInt(w);
  const whole = b / 10n ** 18n;
  const frac = (b % 10n ** 18n).toString().padStart(18, '0').replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole.toString();
}

// Read the gate's live on-chain price. Returns the priceWei string, or null
// when the gate does not exist or the RPC read fails/times out.
async function readOnChainPriceWei(gateId) {
  try {
    const provider = new JsonRpcProvider(RPC, 5042, { staticNetwork: true });
    const contract = new Contract(CONTRACT, GATE_ABI, provider);
    const gate = await Promise.race([
      contract.getGate(gateId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('rpc timeout')), 5000)),
    ]);
    if (!gate || gate.id === undefined || Number(gate.id) === 0) return null;
    return gate.priceUsdcWei.toString();
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('X-Arc-Paywall-Protocol', 'ArcGate');
  res.setHeader('X-Arc-Chain-Id', '5042');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Arc-Tx-Hash');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const gateId = parseInt(req.query?.id, 10);
  if (!Number.isInteger(gateId) || gateId < 1) {
    return res.status(400).json({ status: 400, error: 'Invalid gate id', gateId: req.query?.id ?? null });
  }
  res.setHeader('X-Arc-Gate-Id', String(gateId));

  let priceWei = await readOnChainPriceWei(gateId);
  let priceSource = 'on-chain';
  if (!priceWei) {
    if (FALLBACK_PRICES[gateId]) {
      priceWei = usdcToWei(FALLBACK_PRICES[gateId]);
      priceSource = 'fallback';
    } else {
      return res.status(404).json({ status: 404, error: 'Gate not found', gateId });
    }
  }
  const priceUsdc = weiToUsdc(priceWei);
  res.setHeader('X-Arc-Price-USDC', priceUsdc);
  res.setHeader('X-Arc-Price-Wei', priceWei);
  res.setHeader('X-Arc-Contract', CONTRACT);

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
