/**
 * Client-Side Cryptographic Module for ArcGate
 * AES-256-GCM authenticated encryption via the native Web Crypto API.
 *
 * Key model: every gate gets a random 256-bit raw key generated at creation time.
 * The key is escrowed server-side (see api/keys.js) and released only after the
 * server verifies a real on-chain unlockGate receipt (see api/unlock.js).
 * No passphrase or master key exists in the client bundle.
 */

const getCrypto = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API (crypto.subtle) is not supported in this environment');
};

const bufferToBase64 = (buf) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof btoa !== 'undefined'
    ? btoa(binary)
    : Buffer.from(binary, 'binary').toString('base64');
};

const base64ToBuffer = (str) => {
  const binary = typeof atob !== 'undefined'
    ? atob(str)
    : Buffer.from(str, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

/**
 * Generate a fresh random 256-bit gate key, returned as base64.
 */
export function generateGateKey() {
  const cryptoObj = getCrypto();
  return bufferToBase64(cryptoObj.getRandomValues(new Uint8Array(32)));
}

/**
 * Deterministic key used ONLY for watermarked Sandbox demo content.
 * Not used for any live/mainnet gate.
 */
export function getSandboxDemoKey(gateId) {
  const seed = `arcgate-sandbox-demo-only-${gateId}`;
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = seed.charCodeAt(i % seed.length) ^ (i * 7);
  }
  return bufferToBase64(bytes);
}

async function importRawKey(rawKeyB64) {
  const cryptoObj = getCrypto();
  return cryptoObj.subtle.importKey(
    'raw',
    base64ToBuffer(rawKeyB64),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext with a raw base64 gate key into an "enc:aes-gcm:" envelope.
 */
export async function encryptPayload(plaintext, rawKeyB64) {
  if (!plaintext) return '';
  if (!rawKeyB64) throw new Error('A gate key is required to encrypt (no default key exists)');
  const cryptoObj = getCrypto();
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const key = await importRawKey(rawKeyB64);

  const ciphertext = await cryptoObj.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  const envelope = {
    alg: 'AES-GCM-256',
    iv: bufferToBase64(iv),
    data: bufferToBase64(ciphertext),
  };
  return `enc:aes-gcm:${bufferToBase64(new TextEncoder().encode(JSON.stringify(envelope)))}`;
}

/**
 * Decrypt an "enc:aes-gcm:" envelope with a raw base64 gate key.
 * Returns null on authentication failure instead of leaking partial data.
 */
export async function decryptPayload(envelopeStr, rawKeyB64) {
  if (!envelopeStr) return '';
  if (!envelopeStr.startsWith('enc:aes-gcm:')) return envelopeStr;
  if (!rawKeyB64) return null;

  try {
    const cryptoObj = getCrypto();
    const envelope = JSON.parse(
      new TextDecoder().decode(base64ToBuffer(envelopeStr.replace('enc:aes-gcm:', '')))
    );
    const key = await importRawKey(rawKeyB64);
    const decrypted = await cryptoObj.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBuffer(envelope.iv) },
      key,
      base64ToBuffer(envelope.data)
    );
    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('Decryption authentication failed:', err?.message || err);
    return null;
  }
}

export function isEncryptedEnvelope(str) {
  return typeof str === 'string' && str.startsWith('enc:aes-gcm:');
}
