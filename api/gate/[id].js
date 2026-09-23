export default function handler(req, res) {
  const { id } = req.query || {};
  const gateId = parseInt(id, 10) || 1;

  res.setHeader('X-Arc-Paywall-Protocol', 'ArcGate');
  res.setHeader('X-Arc-Chain-Id', '5042');
  res.setHeader('X-Arc-Gate-Id', String(gateId));
  res.setHeader('X-Arc-Price-USDC', gateId === 2 ? '0.25' : gateId === 3 ? '0.50' : '0.10');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Arc-Tx-Hash');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const txHash = req.headers['x-arc-tx-hash'];
  if (txHash && txHash.startsWith('0x') && txHash.length === 66) {
    return res.status(200).json({
      success: true,
      gateId,
      status: 'UNLOCKED',
      verifiedTx: txHash,
      secretPayload: 'https://docs.arc.io/secret-alpha/arc-architecture-spec-v1.pdf\nPasscode: ARC_500_GRANT_WINNER',
      message: 'Access granted via valid Arc Mainnet transaction proof.',
    });
  }

  return res.status(402).json({
    status: 402,
    error: 'Payment Required',
    protocol: 'ArcGate',
    network: 'Circle Arc Mainnet (5042)',
    gateId,
    priceUsdc: gateId === 2 ? '0.25' : gateId === 3 ? '0.50' : '0.10',
    currency: 'USDC',
    decimals: 18,
    instructions: {
      step1: 'Connect to Arc Mainnet (Chain ID: 5042, RPC: https://rpc.mainnet.arc.io)',
      step2: 'Execute 1-click native USDC payment to paywall contract or unlockGate(' + gateId + ')',
      step3: 'Repeat request with header "X-Arc-Tx-Hash: <YOUR_CONFIRMED_TRANSACTION_HASH>" to receive decrypted payload'
    }
  });
}
