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
  // Ensure neat 4-digit formatting even if id is large
  const num = typeof id === 'number' ? id : parseInt(id, 10) || 1;
  const normalized = num > 9999 ? (num % 10000).toString().padStart(4, '0') : num.toString().padStart(4, '0');
  return `${prefix}${normalized}`;
}

/**
 * Format verifiable buyer license token bound to the actual buyer address:
 * Example: lic_arc_0001_af07 (Mainnet) or lic_sbx_0001_af07 (Sandbox)
 */
export function formatLicenseId(gateId, buyerAddress = '', isSandbox = false) {
  const gateNum = typeof gateId === 'number' ? gateId : parseInt(gateId, 10) || 1;
  const gateStr = (gateNum > 9999 ? (gateNum % 10000) : gateNum).toString().padStart(4, '0');
  const prefix = isSandbox ? 'lic_sbx_' : 'lic_arc_';
  const cleanAddr = buyerAddress && buyerAddress.length >= 4
    ? buyerAddress.replace('0x', '').slice(-4).toLowerCase()
    : 'demo';
  return `${prefix}${gateStr}_${cleanAddr}`;
}

/**
 * Format itemized invoice receipt ID:
 * Mainnet: rcpt_arc_5042_9b3e1f
 * Sandbox: rcpt_sbx_5042_77e9b1
 */
export function formatReceiptId(txHash = '', isSandbox = false) {
  const prefix = isSandbox ? 'rcpt_sbx_5042_' : 'rcpt_arc_5042_';
  // Extract strictly hex substring
  const hexOnly = (txHash || '').replace(/^0x/i, '').replace(/[^0-9a-fA-F]/g, '');
  const hashSuffix = hexOnly.length >= 6 ? hexOnly.slice(0, 6).toLowerCase() : '77e9b1';
  return `${prefix}${hashSuffix}`;
}

/**
 * Format shortened institutional creator handle:
 * Example: @arc/32a4
 */
export function formatCreatorHandle(address = '') {
  if (!address) return '@arc/creator';
  const clean = address.replace('0x', '').slice(0, 4).toLowerCase();
  return `@arc/${clean}`;
}
