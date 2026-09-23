/**
 * Typed Professional ID System for ArcGate (Stripe-style structured IDs)
 */

/**
 * Format gate identifier with typed prefix:
 * Mainnet: gate_arc_0001
 * Sandbox: gate_sbx_0001
 */
export function formatGateId(id, isSandbox = false) {
  if (id === null || id === undefined) return '';
  const prefix = isSandbox ? 'gate_sbx_' : 'gate_arc_';
  const numStr = id.toString().padStart(4, '0');
  return `${prefix}${numStr}`;
}

/**
 * Format verifiable buyer license token:
 * Example: lic_arc_0001_86c4
 */
export function formatLicenseId(gateId, buyerAddress = '') {
  const gateStr = (gateId !== undefined && gateId !== null ? gateId : 1).toString().padStart(4, '0');
  const cleanAddr = (buyerAddress || '86c4').replace('0x', '').slice(-4).toLowerCase();
  return `lic_arc_${gateStr}_${cleanAddr}`;
}

/**
 * Format itemized invoice receipt ID:
 * Example: rcpt_arc_5042_9b3e1f
 */
export function formatReceiptId(txHash = '') {
  const hashSuffix = (txHash || '9b3e1f').replace('0x', '').slice(0, 6).toLowerCase();
  return `rcpt_arc_5042_${hashSuffix}`;
}

/**
 * Format shortened institutional creator handle:
 * Example: @arc/32a4
 */
export function formatCreatorHandle(address = '') {
  if (!address) return '@arc/anon';
  const prefix = address.replace('0x', '').slice(0, 4).toLowerCase();
  return `@arc/${prefix}`;
}
