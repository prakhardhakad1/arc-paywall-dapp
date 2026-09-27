/**
 * Re-encrypts the curated demo gate payloads with deterministic Sandbox-only keys.
 * Run: node scripts/reencrypt-demo.mjs   (prints envelopes to paste into src/config.js)
 */
import { encryptPayload, getSandboxDemoKey } from '../src/lib/crypto.js';

const DEMO_PLAINTEXT = {
  1: 'https://docs.arc.io/secret-alpha/arc-architecture-spec-v1.pdf\nPasscode: ARC_500_GRANT_WINNER',
  2: 'https://t.me/+ArcQuantAlphaVipInvite_77x9qZ',
  3: 'https://github.com/arc-ecosystem/arc-starter-kit-private\nAccess Token: ARC-STARTER-DEMO-TOKEN-2026 (fictional demo credential)',
};

for (const [id, plaintext] of Object.entries(DEMO_PLAINTEXT)) {
  const envelope = await encryptPayload(plaintext, getSandboxDemoKey(id));
  console.log(`gate ${id}:\n${envelope}\n`);
}
