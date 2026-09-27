# ArcGate: Decoupled Micro-Monetization & Tipping Protocol
### Built for Circle's Arc Mainnet • DoraHacks Arc Microgrants ($500 USDC Track)

[![Arc Mainnet](https://img.shields.io/badge/Arc%20Mainnet-Chain%205042-0284c7?style=flat-square)](https://explorer.arc.io)
[![Native Asset](https://img.shields.io/badge/Gas%20Asset-Native%20USDC-10b981?style=flat-square)](https://circle.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> **ArcGate** is a decentralized paywall, link locker, and creator tipping protocol engineered natively for Circle's **Arc Mainnet**. It enables creators, researchers, developers, and autonomous AI agents to monetize digital content (alpha links, private codebases, invites, confidential datasets) behind instant 1-click native USDC micro-payments ($0.05 to $1.00 USDC) with sub-second finality.

---

## ✅ Verified Live on Arc Mainnet

| Item | Value |
|---|---|
| **Contract** | [`0x59a2f8f63cf6a2F918d8299a4B999341A1fC9620`](https://explorer.arc.io/address/0x59a2f8f63cf6a2F918d8299a4B999341A1fC9620) |
| **Deployment tx** | [`0xe2cb14ff91b9b64a22605b8c3c9bfd7242810f205885f605812239caeba1172d`](https://explorer.arc.io/tx/0xe2cb14ff91b9b64a22605b8c3c9bfd7242810f205885f605812239caeba1172d) |
| **Chain** | Arc Mainnet, Chain ID 5042, native USDC gas |
| **Live app** | [arc-paywall-dapp.vercel.app](https://arc-paywall-dapp.vercel.app) |
| **First paid unlock** | _pending — tx hash added after the recorded demo_ |
| **60s demo video** | _pending — Loom link added after the recorded demo_ |

**How to verify yourself:** open the contract on ArcScan, call `getProtocolStats()` (reads live gates, unlocks, tips, volume) and `owner()`; then click **Unlock** on any gate in the live app and follow the receipt's ArcScan link to the settlement transaction.

**Security architecture:** payloads are AES-256-GCM encrypted client-side with a per-gate random 256-bit key; the key is escrowed server-side and released only by `/api/unlock` after it verifies the buyer's `unlockGate` receipt against Arc RPC (status, contract target, function selector, gate id, and buyer address). Escrow splits are 99% creator / 1% protocol with a pull-withdrawal fallback, and the contract enforces `nonReentrant` + strict checks-effects-interactions.

---

## ⚡ 5 Standout Features (Engineered to Win)

### 1. ⚡ Instant Interactive Demo Sandbox (Zero Friction for Judges)
- Judges reviewing 50+ projects can test immediately without needing MetaMask, Arc network RPC configuration, or live USDC balances.
- The **[● Live Mainnet] | [⚡ Sandbox]** toggle in the Navbar lets judges test creating paywalls, 1-click unlocks, micro-tipping, and secret reveals with celebratory confetti bursts.

### 2. 🔌 1-Line Embed Widget Generator (Developer Tooling)
- Enables creators and developers to embed ArcGate paywalls directly into WordPress blogs, Notion docs, Substack, Medium, or custom React/Next.js dApps:
  - **HTML**: `<script src="https://arc-paywall-dapp.vercel.app/widget.js" data-gate-id="1"></script>`
  - The 1-line widget is the only supported integration. Iframe and npm/React embeds are intentionally not offered: the app ships `frame-ancestors 'none'` to protect wallet-signing pages from clickjacking, and no React package exists.

### 3. 🤖 Real HTTP 402 Agentic Commerce API (Vercel Serverless)
- Authentic machine-to-machine micropayments powered by Vercel serverless functions:
  - `GET /api/gate/:id` $\to$ Returns `HTTP 402 Payment Required` with `X-Arc-Paywall-Protocol`, `X-Arc-Chain-Id: 5042`, and `X-Arc-Price-USDC` headers when locked.
  - `POST /api/unlock` $\to$ Verifies the `unlockGate` receipt against Arc RPC (status, contract target, function selector, gate id, buyer address) and only then releases the gate decryption key from server-side escrow. Unverified or fabricated hashes are rejected with 402/403.
  - Interactive agent terminal directly on the homepage lets visitors and judges test real-time agentic micropayments in 0.42s!

### 4. 📊 Arc vs. Ethereum Visual Benchmark
- A high-impact side-by-side comparison card directly highlighting why Arc's native USDC gas asset is revolutionary:
  - **Checkout Flow**: 1-Click Native Transfer vs. 2-Step (Approve + Transfer)
  - **Gas Asset**: Native USDC (Zero Volatility) vs. Volatile ETH
  - **Gas Fee**: ~$0.001 USDC vs. $3.50–$12.00+ ETH
  - **Settlement**: < 1.0s Sub-Second vs. 30s+
  - **$0.10 Payments**: 100% Viable vs. Economically Broken

### 5. 🔒 Client-Side AES-256-GCM Cryptographic Paywalls
- **Cryptographic Honesty**: Secrets are encrypted client-side in the browser via the native Web Crypto API (`crypto.subtle`) using AES-256-GCM with a fresh random 256-bit key per gate.
- **Proof-Gated Key Release**: Gate keys are escrowed server-side (`POST /api/keys`, verified against the `createGate` receipt) and released to buyers only by `POST /api/unlock` after verifying their `unlockGate` receipt. No master key or passphrase exists anywhere in the client bundle.
- **Zero Plaintext Secrets**: Calldata, storage, and the public bundle contain only ciphertext envelopes (`enc:aes-gcm:...`).

---

## 🚀 Deployment & Configuration

1. **Deploy the contract**: `node scripts/deploy.mjs` with `PRIVATE_KEY` set (funds required for Arc gas). Record the printed address.
2. **Initialize Turso**: `node scripts/init-turso.mjs` with server-side `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` (creates `gates`, `unlocks`, `tips`, `gate_keys`).
3. **Build the frontend** with:
   - `VITE_ARC_PAYWALL_ADDRESS` — deployed contract address (without it the app runs in honest Standby mode and refuses live unlocks).
4. **Set serverless env vars** on Vercel: `ARC_PAYWALL_ADDRESS`, `ARC_RPC_URL` (optional), `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`. Key escrow endpoints fail closed (503) if these are missing.

---

## 🏛️ System Architecture

```
                                +-------------------------------+
                                |  Creator / Buyer / AI Agent   |
                                +---------------+---------------+
                                                |
                                       (Connects / Queries)
                                                |
                                                v
               +-----------------------------------------------------------------+
               |                        ArcGate Frontend                         |
               |                  (Vite + React + Tailwind CSS)                  |
               |               [Live Mainnet] | [Demo Sandbox]                   |
               +--------------------------------+--------------------------------+
                                                |
                                 (RPC: https://rpc.mainnet.arc.io)
                                                |
                                                v
               +-----------------------------------------------------------------+
               |                     ArcPaywall.sol Contract                     |
               |                       (Arc Mainnet L1)                          |
               +--------------------------------+--------------------------------+
                                                |
                       +------------------------+------------------------+
                       |                                                 |
                       v                                                 v
      +---------------------------------+               +---------------------------------+
      |          createGate()           |               |          unlockGate()           |
      | - Title, description, price     |               | - 1-Click native USDC msg.value |
      | - Encrypted payload storage     |               | - 99% direct creator payout     |
      | - Instant on-chain event        |               | - Sub-second finality (< 1s)    |
      +---------------------------------+               +---------------------------------+
```

---

## 📜 Smart Contract Specs (`ArcPaywall.sol`)

- **Network**: Arc Mainnet (Chain ID: `5042` / `0x13b2`)
- **Native Currency**: `USDC` (18 decimals)
- **Security Hardening**:
  - `protocolFeesAvailable` accumulator prevents owner from draining creator escrow during protocol fee sweeps.
  - `nonReentrant` mutex and strict Checks-Effects-Interactions (CEI) in `unlockGate` and `withdrawCreatorEarnings`.
  - Zero owner backdoors: `getGate` strictly checks buyer unlock state.
- **Key Functions**:
  - `createGate(string title, string description, string secretPayload, uint256 priceUsdcWei)`: Creates a new paywalled secret gate.
  - `unlockGate(uint256 gateId) payable`: Unlocks a gate by sending the required native USDC fee.
  - `tipCreator(address payable creator, string message) payable`: Sends a direct P2P USDC tip with an on-chain thank-you message.
  - `setGateActive(uint256 gateId, bool active)`: Allows creators to pause/resume gates on-chain.
  - `setGatePrice(uint256 gateId, uint256 newPriceWei)`: Allows creators to update gate pricing.
  - `getGate(uint256 gateId)`: Returns public metadata, revealing `secretPayload` only if the caller has unlocked the gate.
  - `getRecentGates(uint256 offset, uint256 limit)`: Fetches paginated gates for the frontend without external indexers.
  - `getProtocolStats()`: Returns real-time analytics (total volume, unlocks, tips, and gates created).

---

## 🚀 Step-by-Step Deployment Guide (Zero Knowledge Required)

### Step 1: Configure Your MetaMask Wallet
1. Open MetaMask $\to$ Click the network dropdown $\to$ **Add Network** $\to$ **Add a network manually**.
2. Fill in the Arc Mainnet parameters:
   - **Network Name**: `Arc Mainnet`
   - **New RPC URL**: `https://rpc.mainnet.arc.io`
   - **Chain ID**: `5042`
   - **Currency Symbol**: `USDC`
   - **Block Explorer URL**: `https://explorer.arc.io`
3. Save and switch to Arc Mainnet.

### Step 2: Deploy the Smart Contract via Remix in 2 Minutes
1. Go to [Remix Ethereum IDE](https://remix.ethereum.org) in your web browser.
2. In the left file explorer, create a new file named `ArcPaywall.sol`.
3. Copy the entire contents of [`contracts/ArcPaywall.sol`](contracts/ArcPaywall.sol) and paste it into Remix.
4. Click the **Solidity Compiler** tab on the left (version `0.8.20` or higher) and click **Compile ArcPaywall.sol**.
5. Click the **Deploy & Run Transactions** tab:
   - In **ENVIRONMENT**, select **Injected Provider - MetaMask**.
   - Make sure your MetaMask shows `Arc (5042)`!
   - Click the orange **Deploy** button.
   - Confirm the transaction in MetaMask (gas is paid in native USDC).
6. Once confirmed, copy your newly deployed contract address from the bottom left!

### Step 3: Link Contract Address in Frontend
1. Open [`src/config.js`](src/config.js).
2. Replace:
   ```javascript
   export const ARC_PAYWALL_CONTRACT_ADDRESS = '0xYourDeployedAddressHere';
   ```
3. Save the file.

### Step 4: Host on Vercel for Free
1. Push to GitHub:
   ```bash
   git add .
   git commit -m "feat: 5 high-impact upgrades for ArcGate"
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com) $\to$ **Add New Project** $\to$ Import your `https://github.com/prakhardhakad1/arc-paywall-dapp` repository.
3. Click **Deploy**. Your dApp will be live in 30 seconds!

---

## 📝 Pre-Written DoraHacks Arc Microgrants Submission Copy

Use this exact text when filling out your DoraHacks submission form at [dorahacks.io/hackathon/arc-microgrants/detail](https://dorahacks.io/hackathon/arc-microgrants/detail):

### Project Name:
`ArcGate — Native USDC Micro-Paywall & Tipping Protocol`

### Tagline:
`Decoupled creator micro-monetization & agentic micropayments powered by Circle's Arc Mainnet native USDC gas.`

### Problem Statement:
Existing subscription models ($10-$30/month) force users into all-or-nothing commitments for single pieces of content. Furthermore, on traditional EVM networks, sending micro-payments in USDC requires paying gas in ETH and performing 2-step ERC-20 approvals (`approve` then `transferFrom`), making sub-$1 transactions economically unviable.

### Solution:
ArcGate leverages Circle's newly launched **Arc Mainnet**, where **USDC is the native gas asset**. By utilizing native transfers (`msg.value`), ArcGate enables 1-click instant unlock of digital assets (research alpha, secret links, private Discord/Telegram invites, code repositories) for as low as $0.05 USDC with zero token approvals and sub-second settlement.

### Key Features:
- **Zero-Friction Sandbox Mode**: Interactive demo sandbox for judges and users without MetaMask or Arc funds.
- **1-Line Embed Widget Generator**: a single `<script>` tag for creators to monetize anywhere (iframing is intentionally disabled by CSP for clickjacking protection).
- **Autonomous AI Agent Micropayments**: HTTP 402 Payment Required integration for agentic commerce.
- **Arc vs. Ethereum Visual Benchmark**: Proof of Arc's superior stablecoin-native architecture.
- **99% Direct Creator Revenue**: Immediate on-chain distribution upon unlock.

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## 📄 License
MIT License. Open-source for the Circle Arc Ecosystem.
