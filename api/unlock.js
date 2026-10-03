import { ethers } from 'ethers';
import {
  SELECTORS,
  verifyTx,
  parseGateIdArg,
  getGatePrice,
  getGateMeta,
  getKey,
  recordClaim,
  hasClaim,
  sendError,
} from './_verify.js';
import {
  getX402Enabled,
  parsePaymentSignature,
  checkAuthorizationMatchesQuote,
  facilitatorVerify,
  facilitatorSettle,
  facilitatorResultValid,
  buildPaymentResponse,
  weiToAtomicUnits,
  X402_USDC_ASSET,
} from './_x402.js';

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Arc-Tx-Hash, PAYMENT-SIGNATURE');
  res.setHeader('Access-Control-Expose-Headers', 'PAYMENT-RESPONSE');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // x402 agent-payment path: the agent paid via EIP-3009 (Arc native-USDC
  // precompile) and presents the base64 PaymentPayload in PAYMENT-SIGNATURE.
  // No separate EIP-191 claim signature is needed — the EIP-712 signature
  // inside the authorization already proves the payer's identity.
  if (req.headers['payment-signature']) {
    return handleX402Unlock(req, res);
  }

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

    // Idempotent claims: the first valid claim records this tx; a repeat
    // claim by the same payer returns the same key (marked replay) instead
    // of being treated as a new event. Legit retries are never blocked.
    const claim = await recordClaim(txHash, unlockedGateId, from);
    return res.status(200).json({
      success: true,
      gateId: unlockedGateId,
      key,
      ...(claim.replay ? { replay: true, note: 'This transaction was already claimed; returning the same key.' } : {}),
    });
  } catch (err) {
    return sendError(res, err);
  }
}
/**
 * x402 v2 agent-payment claim path.
 *
 * The agent already received HTTP 402 with a PAYMENT-REQUIRED header from
 * /api/gate/:id, signed an EIP-3009 transferWithAuthorization against Arc's
 * native-USDC precompile, and retried with the base64 PaymentPayload in the
 * PAYMENT-SIGNATURE header. Flow here:
 *
 *   1. Gate must have x402 explicitly enabled (opt-in, OFF by default).
 *   2. Parse + sanity-check the payload against the gate's on-chain quote.
 *   3. Replay peek: an already-claimed nonce is served WITHOUT re-settling —
 *      the buyer can never be charged twice for one authorization.
 *   4. Facilitator /verify, then /settle (buyer -> creator directly).
 *      Nothing is recorded before a successful settle, so a facilitator
 *      outage can never turn into a free key — retries are always safe.
 *   5. Record the claim, release the decryption key + PAYMENT-RESPONSE.
 *
 * Settlement bypasses the ArcPaywall contract (x402 pays payTo directly), so
 * the 1% protocol fee does not apply to x402 sales. Failures never serve the
 * key; the facilitator is the only party trusted for on-chain verification.
 * Double-submits are safe: the EIP-3009 nonce cannot be spent twice on-chain,
 * so a concurrent duplicate settle fails and the retry is served via the
 * replay peek.
 */
async function handleX402Unlock(req, res) {
  try {
    const gateId = parseInt(req.body?.gate_id ?? req.query?.gate_id, 10);
    if (!Number.isInteger(gateId) || gateId < 1) {
      return res.status(400).json({ success: false, error: 'gate_id is required for x402 payment' });
    }

    if (!(await getX402Enabled(gateId))) {
      return res.status(402).json({
        success: false,
        error: 'x402 agent payments are not enabled for this gate',
      });
    }

    const payload = parsePaymentSignature(req.headers['payment-signature']);

    let meta;
    try {
      meta = await getGateMeta(gateId);
    } catch (e) {
      return res.status(e.status || 503).json({ success: false, error: e.message });
    }
    if (!meta.active) {
      return res.status(404).json({ success: false, error: 'Gate not found or paused' });
    }

    const amount = weiToAtomicUnits(meta.priceWei);
    const { from, nonce } = checkAuthorizationMatchesQuote(payload, {
      amount,
      payTo: meta.creator,
      asset: X402_USDC_ASSET,
    });
    const claimId = `x402:${nonce}`.toLowerCase();

    const serveKey = async (replay, transaction) => {
      const key = await getKey(gateId);
      if (!key) {
        return res.status(409).json({
          success: false,
          error: 'No escrowed key for this gate. The creator must escrow the gate key at creation time.',
        });
      }
      res.setHeader(
        'PAYMENT-RESPONSE',
        buildPaymentResponse({ success: true, transaction, payer: from })
      );
      return res.status(200).json({
        success: true,
        gateId,
        key,
        x402: {
          payer: from,
          amount,
          asset: X402_USDC_ASSET,
          network: 'eip155:5042',
          transaction,
        },
        ...(replay
          ? { replay: true, note: 'This x402 authorization was already claimed; returning the same key without re-settling.' }
          : {}),
      });
    };

    // Replay peek first: never charge twice for one authorization.
    if (await hasClaim(claimId)) {
      return serveKey(true, null);
    }

    let verifyResult;
    try {
      verifyResult = await facilitatorVerify(payload);
    } catch (e) {
      return res.status(e.status || 502).json({ success: false, error: e.message });
    }
    if (!facilitatorResultValid(verifyResult)) {
      // A spent nonce fails verification: one last peek in case a concurrent
      // request settled+recorded between our first peek and now.
      if (await hasClaim(claimId)) {
        return serveKey(true, null);
      }
      return res.status(402).json({
        success: false,
        error: 'x402 payment verification failed: facilitator rejected the authorization (it may be invalid, expired, or already spent)',
      });
    }

    let transaction = null;
    try {
      const settleResult = await facilitatorSettle(payload);
      transaction = settleResult.transaction || settleResult.txHash || null;
    } catch (e) {
      return res.status(e.status || 502).json({
        success: false,
        error: `x402 settlement failed and was not submitted: ${e.message}. Safe to retry with the same authorization.`,
      });
    }

    await recordClaim(claimId, gateId, from);
    return serveKey(false, transaction);
  } catch (err) {
    return sendError(res, err);
  }
}
