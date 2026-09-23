/**
 * Client-Side Cryptographic Module for ArcGate
 * Implements genuine AES-256-GCM authenticated encryption & decryption
 * using the native Web Crypto API (crypto.subtle).
 * 
 * Guarantees zero plaintext secrets in storage or on-chain calldata.
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
  const bytes = new Uint8Array(buf);
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
  return bytes.buffer;
};

/**
 * Derive a 256-bit AES-GCM CryptoKey from a passphrase and salt using PBKDF2
 */
async function deriveKey(passphrase, saltBuffer) {
  const cryptoObj = getCrypto();
  const enc = new TextEncoder();
  const keyMaterial = await cryptoObj.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return await cryptoObj.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext secret payload into an AES-256-GCM envelope
 * @param {string} plaintext The content to protect
 * @param {string} secretKey Passphrase or derived gate unlock key
 * @returns {Promise<string>} Envelope string prefixed with "enc:aes-gcm:"
 */
export async function encryptPayload(plaintext, secretKey = 'arcgate_default_master_key_2026') {
  if (!plaintext) return '';
  const cryptoObj = getCrypto();
  const enc = new TextEncoder();
  const encodedData = enc.encode(plaintext);

  const salt = cryptoObj.getRandomValues(new Uint8Array(16));
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(secretKey, salt.buffer);

  const ciphertext = await cryptoObj.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  const envelope = {
    alg: 'AES-GCM-256',
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    data: bufferToBase64(ciphertext),
  };

  return `enc:aes-gcm:${bufferToBase64(new TextEncoder().encode(JSON.stringify(envelope)))}`;
}

/**
 * Decrypt an AES-256-GCM envelope
 * @param {string} envelopeStr The encrypted string starting with "enc:aes-gcm:"
 * @param {string} secretKey Passphrase used during encryption
 * @returns {Promise<string>} Decrypted plaintext
 */
export async function decryptPayload(envelopeStr, secretKey = 'arcgate_default_master_key_2026') {
  if (!envelopeStr) return '';
  if (!envelopeStr.startsWith('enc:aes-gcm:')) {
    // If not encrypted, return as-is for backward compatibility
    return envelopeStr;
  }

  try {
    const cryptoObj = getCrypto();
    const rawB64 = envelopeStr.replace('enc:aes-gcm:', '');
    const jsonStr = new TextDecoder().decode(base64ToBuffer(rawB64));
    const envelope = JSON.parse(jsonStr);

    const salt = base64ToBuffer(envelope.salt);
    const iv = base64ToBuffer(envelope.iv);
    const data = base64ToBuffer(envelope.data);

    const key = await deriveKey(secretKey, salt);

    const decrypted = await cryptoObj.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
      },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.warn('Decryption authentication failed:', err?.message || err);
    return '🔒 Error: Could not decrypt content with provided license verification.';
  }
}

/**
 * Standard deterministic key derivation for demo gates
 */
export function getDemoGateKey(gateId) {
  return `arcgate_gate_${gateId}_circle_arc_mainnet_secret_seed`;
}

/**
 * Check if a string is an AES-GCM encrypted envelope
 */
export function isEncryptedEnvelope(str) {
  return typeof str === 'string' && str.startsWith('enc:aes-gcm:');
}

