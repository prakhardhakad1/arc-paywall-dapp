import assert from 'node:assert';
import {
  generateGateKey,
  encryptPayload,
  decryptPayload,
  getSandboxDemoKey,
  isEncryptedEnvelope,
} from './src/lib/crypto.js';
import { DEMO_GATES } from './src/config.js';
import { SELECTORS, parseGateIdArg } from './api/_verify.js';

console.log('🧪 ArcGate Cryptographic Key-Release Verification...\n');

console.log('Test A: AES-256-GCM roundtrip with random gate key');
const key = generateGateKey();
const envelope = await encryptPayload('https://example.com/secret\nPasscode: HUNTER2', key);
assert.ok(isEncryptedEnvelope(envelope), 'Envelope prefix required');
assert.strictEqual(await decryptPayload(envelope, key), 'https://example.com/secret\nPasscode: HUNTER2');
console.log('  ✓ Roundtrip decrypts to exact plaintext');

console.log('Test B: Wrong key fails authentication (GCM tag)');
const wrong = await decryptPayload(envelope, generateGateKey());
assert.strictEqual(wrong, null, 'Wrong key must return null, never partial data');
console.log('  ✓ Wrong key rejected with null');

console.log('Test C: No default/master key exists');
let threw = false;
try {
  await encryptPayload('x');
} catch (e) {
  threw = true;
}
assert.ok(threw, 'encryptPayload without an explicit key must throw');
console.log('  ✓ encryptPayload requires an explicit gate key');

console.log('Test D: Demo gate envelopes decrypt with sandbox-only keys');
for (const g of DEMO_GATES) {
  const pt = await decryptPayload(g.secretPayload, getSandboxDemoKey(g.id));
  assert.ok(pt && pt.length > 0, `Demo gate ${g.id} must decrypt with its sandbox key`);
  assert.ok(!g.secretPayload.includes('http'), `Demo gate ${g.id} bundle value must be ciphertext`);
}
console.log('  ✓ All demo envelopes decrypt; bundle holds ciphertext only');

console.log('Test E: Server verification selectors and gate-id parsing');
const unlockInput = SELECTORS.unlockGate + '0'.repeat(64 - 2) + '07';
assert.strictEqual(parseGateIdArg(unlockInput), 7);
assert.strictEqual(SELECTORS.unlockGate.length, 10);
assert.strictEqual(SELECTORS.createGate.length, 10);
console.log('  ✓ Selectors and uint256 argument parsing correct');

console.log('\n✅ All cryptographic key-release tests passed.');
