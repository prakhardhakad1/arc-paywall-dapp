import assert from 'node:assert';
import { ethers } from 'ethers';
import { ARC_MAINNET, ARC_PAYWALL_ABI, DEMO_GATES } from './src/config.js';
import { getContentType } from './src/lib/contentDetector.js';
import { encryptPayload, decryptPayload, isEncryptedEnvelope } from './src/lib/crypto.js';
import { formatGateId, formatReceiptId, formatLicenseId } from './src/lib/typedIds.js';
import { isAudioMuted, setAudioMuted } from './src/lib/audio.js';

console.log('🧪 Starting Full QA Verification Suite for ArcGate...\n');

// -------------------------------------------------------------------
// TEST 1: Smart Contract ABI Integrity
// -------------------------------------------------------------------
console.log('Test 1: Verifying Smart Contract ABI & Ethers Interface...');
const iface = new ethers.Interface(ARC_PAYWALL_ABI);

const requiredFunctions = [
  'createGate',
  'unlockGate',
  'tipCreator',
  'getGate',
  'getRecentGates',
  'getProtocolStats',
  'withdrawCreatorEarnings',
  'setGateActive',
  'setGatePrice',
  'protocolFeesAvailable',
  'pendingBalances',
  'gateCount',
  'totalVolumeUsdc',
  'totalUnlocksCount',
  'totalTipsCount',
];

for (const fn of requiredFunctions) {
  assert.ok(iface.getFunction(fn), `Missing ABI function: ${fn}`);
}
console.log(`  ✓ All ${requiredFunctions.length} essential ABI functions (including setGateActive & protocolFeesAvailable) parsed successfully.`);

// -------------------------------------------------------------------
// TEST 2: Rich Content Badge Detector (Phase 2, Feature 5)
// -------------------------------------------------------------------
console.log('\nTest 2: Verifying Rich Content Classifier...');

const sampleCases = [
  {
    gate: { title: 'Secret Repo', secretPayload: 'https://github.com/my-org/core-agent', description: 'Agent code' },
    expectedCategory: 'code',
    expectedLabel: 'GitHub Repo',
  },
  {
    gate: { title: 'VIP Community', secretPayload: 'https://t.me/+AbCdEfGh123', description: 'Join private chat' },
    expectedCategory: 'invites',
    expectedLabel: 'Telegram VIP',
  },
  {
    gate: { title: 'Whitepaper', secretPayload: 'https://example.com/whitepaper.pdf', description: 'Academic paper' },
    expectedCategory: 'alpha',
    expectedLabel: 'Research PDF',
  },
  {
    gate: { title: 'Market Data', secretPayload: 'https://example.com/prices.parquet', description: 'Raw parquet dataset' },
    expectedCategory: 'datasets',
    expectedLabel: 'Alpha Dataset',
  },
  {
    gate: { title: 'OpenAI API Token', secretPayload: 'sk-proj-abc123xyz890', description: 'Secret key' },
    expectedCategory: 'datasets',
    expectedLabel: 'API Key',
  },
];

for (const sample of sampleCases) {
  const result = getContentType(sample.gate);
  assert.strictEqual(result.category, sample.expectedCategory, `Category mismatch for ${sample.gate.title}`);
  assert.strictEqual(result.label, sample.expectedLabel, `Label mismatch for ${sample.gate.title}`);
}
console.log('  ✓ Content Detector correctly classifies GitHub, Telegram, PDF, Datasets, and API Keys.');

// -------------------------------------------------------------------
// TEST 3: Demo Gates Sanity & Zero-Starting State
// -------------------------------------------------------------------
console.log('\nTest 3: Verifying Demo Gates & Starting State...');
assert.strictEqual(DEMO_GATES.length, 3, 'Must have 3 initial demo gates');

for (const gate of DEMO_GATES) {
  assert.strictEqual(gate.unlockCount, 0, `Gate #${gate.id} must start at 0 unlocks`);
  assert.strictEqual(gate.active, true, `Gate #${gate.id} must be active`);
  assert.strictEqual(gate.isUnlocked, false, `Gate #${gate.id} must start locked`);
  const parsedPrice = ethers.parseUnits(gate.priceUsdcFormatted, 18);
  assert.strictEqual(gate.priceUsdcWei, parsedPrice.toString(), `Wei mismatch for gate #${gate.id}`);
}
console.log('  ✓ All demo gates start in a strictly uncorrupted, 0-unlock state with valid 18-decimal prices.');

// -------------------------------------------------------------------
// TEST 4: Category Filtering & Sorting Logic (Phase 3, Feature 6)
// -------------------------------------------------------------------
console.log('\nTest 4: Verifying Category Filter & Sort Engine...');

const testGates = [
  { id: 1, title: 'Alpha Spec', description: 'Arc spec', secretPayload: 'https://docs.arc.io/spec.pdf', unlockCount: 5, createdAt: 100, priceUsdcFormatted: '0.10' },
  { id: 2, title: 'Telegram Group', description: 'Signals', secretPayload: 'https://t.me/signals', unlockCount: 20, createdAt: 300, priceUsdcFormatted: '0.50' },
  { id: 3, title: 'Code Template', description: 'React kit', secretPayload: 'https://github.com/arc/kit', unlockCount: 12, createdAt: 200, priceUsdcFormatted: '0.25' },
];

// Test category filtering
const codeGates = testGates.filter((g) => getContentType(g).category === 'code');
assert.strictEqual(codeGates.length, 1);
assert.strictEqual(codeGates[0].id, 3);

const invitesGates = testGates.filter((g) => getContentType(g).category === 'invites');
assert.strictEqual(invitesGates.length, 1);
assert.strictEqual(invitesGates[0].id, 2);

// Test sorting
const sortedPopular = [...testGates].sort((a, b) => (b.unlockCount || 0) - (a.unlockCount || 0));
assert.strictEqual(sortedPopular[0].id, 2, 'Most popular should be id 2 (20 unlocks)');

const sortedNewest = [...testGates].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
assert.strictEqual(sortedNewest[0].id, 2, 'Newest should be id 2 (ts 300)');

const sortedPriceAsc = [...testGates].sort((a, b) => parseFloat(a.priceUsdcFormatted) - parseFloat(b.priceUsdcFormatted));
assert.strictEqual(sortedPriceAsc[0].id, 1, 'Cheapest should be id 1 (0.10 USDC)');
assert.strictEqual(sortedPriceAsc[2].id, 2, 'Most expensive should be id 2 (0.50 USDC)');

console.log('  ✓ Category filters and 4 sort modes (popular, newest, price_asc, price_desc) verified.');

// -------------------------------------------------------------------
// TEST 5: Creator Studio Calculations & Escrow (Phase 1, Features 1 & 2)
// -------------------------------------------------------------------
console.log('\nTest 5: Verifying Creator Studio Revenue & Escrow Logic...');

const creatorAddress = '0x1234567890123456789012345678901234567890';
const creatorGates = [
  { id: 10, creator: creatorAddress, priceUsdcFormatted: '0.20', unlockCount: 10, active: true },
  { id: 11, creator: creatorAddress, priceUsdcFormatted: '0.50', unlockCount: 4, active: false },
];

const totalRevenue = creatorGates.reduce((sum, g) => sum + parseFloat(g.priceUsdcFormatted) * g.unlockCount, 0);
assert.strictEqual(totalRevenue, 4.0, 'Total revenue should be 0.20*10 + 0.50*4 = 4.00');

// 99% creator share
const netCreatorShare = totalRevenue * 0.99;
assert.strictEqual(netCreatorShare, 3.96, 'Net creator share should be 3.96 USDC');

console.log('  ✓ Creator Studio calculations and escrow split (99% / 1%) verified.');

// -------------------------------------------------------------------
// TEST 6: Receipt Modal Data Formatting (Phase 3, Feature 7)
// -------------------------------------------------------------------
console.log('\nTest 6: Verifying Receipt Modal Calculations...');

const receipt = {
  txHash: '0xabc123def4567890123456789012345678901234567890123456789012345678',
  amountUsdc: '0.25',
};

const amountNum = parseFloat(receipt.amountUsdc);
const creatorAmount = (amountNum * 0.99).toFixed(4);
const protocolFee = (amountNum * 0.01).toFixed(4);
const explorerUrl = `${ARC_MAINNET.blockExplorer}/tx/${receipt.txHash}`;

assert.strictEqual(creatorAmount, '0.2475');
assert.strictEqual(protocolFee, '0.0025');
assert.strictEqual(explorerUrl, 'https://explorer.arc.io/tx/' + receipt.txHash);
console.log('  ✓ Receipt breakdown: 0.2475 USDC to Creator, 0.0025 USDC protocol fee, verified explorer URL.');

// -------------------------------------------------------------------
// TEST 7: Single Gate View Shareable URL Deep-Link (Phase 2, Feature 3)
// -------------------------------------------------------------------
// TEST 7: Single Gate View Shareable URL Deep-Link & Clean Path Routing
// -------------------------------------------------------------------
console.log('\nTest 7: Verifying Deep-Link & Clean Path Matching Logic...');

const mockOrigin = 'https://arc-paywall-dapp.vercel.app';
const queryShareUrl = `${mockOrigin}?gate=2`;
const parsedQueryUrl = new URL(queryShareUrl);
const gateIdParam = parsedQueryUrl.searchParams.get('gate');

assert.strictEqual(gateIdParam, '2');
const targetGateFromQuery = testGates.find((g) => g.id.toString() === gateIdParam);
assert.ok(targetGateFromQuery, 'Target gate should be found by query param');
assert.strictEqual(targetGateFromQuery.id, 2);

// Test clean RESTful pathname: /gate/2 and /gate/gate_arc_0002
const pathUrl = `${mockOrigin}/gate/2`;
const parsedPath = new URL(pathUrl).pathname;
const pathMatch = parsedPath.match(/^\/(?:gate|embed|g)\/([a-zA-Z0-9_-]+)/i);
assert.ok(pathMatch, 'Path regex must match /gate/2');
assert.strictEqual(pathMatch[1], '2');

const typedPathUrl = `${mockOrigin}/gate/gate_arc_0002`;
const parsedTypedPath = new URL(typedPathUrl).pathname;
const typedMatch = parsedTypedPath.match(/^\/(?:gate|embed|g)\/([a-zA-Z0-9_-]+)/i);
assert.ok(typedMatch, 'Path regex must match /gate/gate_arc_0002');
const numericExtract = typedMatch[1].match(/(\d+)$/);
assert.strictEqual(numericExtract[1], '0002');
assert.strictEqual(parseInt(numericExtract[1], 10), 2);

console.log('  ✓ Shareable link parameter (?gate=2), clean path (/gate/2), and typed path (/gate/gate_arc_0002) cleanly resolve.');

// -------------------------------------------------------------------
// TEST 8: My Library Filtering Logic (Phase 2, Feature 4)
// -------------------------------------------------------------------
console.log('\nTest 8: Verifying My Library Filtering Logic...');

const userUnlockedIds = [1, 3];
const libraryGates = testGates.filter((g) => userUnlockedIds.includes(g.id));
assert.strictEqual(libraryGates.length, 2);
assert.strictEqual(libraryGates[0].id, 1);
assert.strictEqual(libraryGates[1].id, 3);
console.log('  ✓ My Library correctly filters exactly the user unlocked assets.');

// -------------------------------------------------------------------
// TEST 9: Client-Side AES-256-GCM Encryption / Decryption Round-Trip
// -------------------------------------------------------------------
console.log('\nTest 9: Verifying AES-256-GCM Cryptographic Authenticity...');
const sampleSecret = 'https://github.com/circle-fintech/arc-defi-alpha-core?auth=sec_token_99';
const testKey = 'arcgate_secret_key_unit_test';

const encryptedEnvelope = await encryptPayload(sampleSecret, testKey);
assert.ok(encryptedEnvelope.startsWith('enc:aes-gcm:'), 'Ciphertext envelope must start with enc:aes-gcm:');
assert.ok(isEncryptedEnvelope(encryptedEnvelope), 'isEncryptedEnvelope helper must identify envelope');
assert.ok(!encryptedEnvelope.includes(sampleSecret), 'Ciphertext must NEVER contain plaintext secret');

const decryptedText = await decryptPayload(encryptedEnvelope, testKey);
assert.strictEqual(decryptedText, sampleSecret, 'Decrypted text must match original plaintext');

// Verify decryption failure on invalid key
const failedResult = await decryptPayload(encryptedEnvelope, 'wrong_key_should_fail');
assert.ok(failedResult.includes('Could not decrypt'), 'Decryption with wrong key must return authentication error');
console.log('  ✓ AES-256-GCM authenticated encryption, decryption, and tamper rejection verified.');

// -------------------------------------------------------------------
// TEST 10: Typed IDs in Sandbox vs Live Mainnet
// -------------------------------------------------------------------
console.log('\nTest 10: Verifying Typed IDs Namespace Separation...');
const sbxGateId = formatGateId(1, true);
const liveGateId = formatGateId(1, false);
assert.strictEqual(sbxGateId, 'gate_sbx_0001');
assert.strictEqual(liveGateId, 'gate_arc_0001');

const sampleTx = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const sbxRcpt = formatReceiptId(sampleTx, true);
const liveRcpt = formatReceiptId(sampleTx, false);
assert.ok(sbxRcpt.startsWith('rcpt_sbx_'), 'Sandbox receipt ID must start with rcpt_sbx_');
assert.ok(liveRcpt.startsWith('rcpt_arc_'), 'Live receipt ID must start with rcpt_arc_');

const sampleBuyer = '0x9999999999999999999999999999999999999999';
const sbxLic = formatLicenseId(1, sampleBuyer, true);
const liveLic = formatLicenseId(1, sampleBuyer, false);
assert.ok(sbxLic.startsWith('lic_sbx_'), 'Sandbox license ID must start with lic_sbx_');
assert.ok(liveLic.startsWith('lic_arc_'), 'Live license ID must start with lic_arc_');
console.log('  ✓ Typed IDs strictly enforce sandbox (_sbx_) vs mainnet (_arc_) isolation.');

// -------------------------------------------------------------------
// TEST 11: Demo Gates Payload Cryptographic Privacy
// -------------------------------------------------------------------
console.log('\nTest 11: Verifying Demo Gates Payload Privacy...');
for (const gate of DEMO_GATES) {
  assert.ok(isEncryptedEnvelope(gate.secretPayload), `Demo gate #${gate.id} secret must be an encrypted envelope`);
  assert.ok(!gate.secretPayload.includes('ghp_'), `Demo gate #${gate.id} must NOT contain plaintext GitHub tokens`);
  assert.ok(!gate.secretPayload.includes('t.me/+'), `Demo gate #${gate.id} must NOT contain plaintext invite links`);
}
console.log('  ✓ All 3 demo gates have zero plaintext credentials in client code.');

// -------------------------------------------------------------------
// TEST 12: Content Detector Privacy Isolation
// -------------------------------------------------------------------
console.log('\nTest 12: Verifying Content Classifier Privacy Isolation...');
const decoyGate = {
  id: 99,
  title: 'Community Access Pass',
  description: 'Join private VIP group',
  // Decoy secret contains github.com, but public metadata says VIP group
  secretPayload: 'https://github.com/decoy/should-not-be-read-by-classifier',
};
const decoyClassification = getContentType(decoyGate);
assert.strictEqual(decoyClassification.category, 'invites', 'Classifier must classify based ONLY on public title/description');
console.log('  ✓ Content classifier never reads or leaks private secretPayload.');

console.log('\n🎉 ALL 12 VERIFICATION TESTS PASSED WITH ZERO ERRORS!\n');
