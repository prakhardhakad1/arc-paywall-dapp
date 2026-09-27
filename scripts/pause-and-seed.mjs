/**
 * One-off maintenance script:
 *  1. Pauses the three keyless (unrecoverable) gates created before the escrow fix.
 *  2. Publishes a fresh demo gate with a properly escrowed AES-256-GCM key.
 *
 * Run: node scripts/pause-and-seed.mjs
 */
import fs from 'node:fs';
import { ethers } from 'ethers';
import { generateGateKey, encryptPayload } from '../src/lib/crypto.js';

const CONTRACT = '0x59a2f8f63cf6a2F918d8299a4B999341A1fC9620';
const API = 'https://arc-paywall-dapp.vercel.app';

const env = Object.fromEntries(
  fs
    .readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const ABI = JSON.parse(fs.readFileSync('contracts/ArcPaywall.json', 'utf8')).abi;
const provider = new ethers.JsonRpcProvider('https://rpc.mainnet.arc.io', { chainId: 5042, name: 'arc' });
const wallet = new ethers.Wallet(env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT, ABI, wallet);
const iface = new ethers.Interface(ABI);

const balance = async () => ethers.formatUnits(await provider.getBalance(wallet.address), 18);

async function main() {
  console.log('wallet:', wallet.address, '| balance:', await balance());

  // 1. Pause the keyless gates so nobody can buy an undecryptable listing.
  for (const id of [1, 2, 3]) {
    const gate = await contract.getGate(id);
    if (gate.id === 0n) continue;
    if (!gate.active) {
      console.log(`gate #${id} already paused`);
      continue;
    }
    const tx = await contract.setGateActive(id, false);
    const rc = await tx.wait(1);
    console.log(`paused gate #${id} | tx ${tx.hash} | gas ${rc.gasUsed}`);
  }

  // 2. Publish a fresh demo gate with a real, escrowed key.
  const title = 'ArcGate Demo Drop — Private Repo Access';
  const description =
    'Unlock to reveal the private resource link and the demo passcode. Settled in native USDC on Circle’s Arc Mainnet.';
  const secret =
    'https://github.com/prakhardhakad1/arc-paywall-dapp\nAccess code: ARC-DEMO-2026';

  const gateKey = generateGateKey();
  const envelope = await encryptPayload(secret, gateKey);

  const tx = await contract.createGate(title, description, envelope, ethers.parseUnits('0.1', 18));
  const rc = await tx.wait(1);
  const created = rc.logs
    .map((l) => {
      try {
        return iface.decodeEventLog('GateCreated', l.data, l.topics);
      } catch (e) {
        return null;
      }
    })
    .find(Boolean);

  const gateId = Number(created.id);
  console.log(`created gate #${gateId} | tx ${tx.hash} | gas ${rc.gasUsed}`);

  const res = await fetch(`${API}/api/keys`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gate_id: gateId, key: gateKey, create_tx_hash: tx.hash }),
  });
  console.log('escrow response:', res.status, await res.text());

  console.log('final balance:', await balance());
}

main().catch((e) => {
  console.error('FAILED:', e.shortMessage || e.message || e);
  process.exit(1);
});
