# ArcGate: Decoupled Micro-Monetization & Tipping Protocol
### Built for Circle's Arc Mainnet • DoraHacks Arc Microgrants ($500 USDC Track)

[![Arc Mainnet](https://img.shields.io/badge/Arc%20Mainnet-Chain%205042-0284c7?style=flat-square)](https://explorer.arc.io)
[![Native Asset](https://img.shields.io/badge/Gas%20Asset-Native%20USDC-10b981?style=flat-square)](https://circle.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

> **ArcGate** is a decentralized paywall, link locker, and creator tipping protocol engineered natively for Circle's **Arc Mainnet**. It enables creators, researchers, and developers to monetize digital content (alpha links, private codebases, invites, confidential research) behind instant 1-click native USDC micro-payments ($0.05 to $1.00 USDC) with sub-second finality.

---

## ⚡ The Arc Superpower: Why ArcGate Exists

On standard EVM networks (Ethereum, Polygon, Arbitrum), executing a micro-transaction in USDC is burdened with severe UX friction:
1. **The Approval Tax**: Users must submit an `approve()` ERC-20 transaction before calling the contract, requiring two separate wallet confirmations.
2. **Volatile Gas Assets**: Users are forced to hold volatile tokens (ETH, MATIC) just to pay gas for stablecoin transactions.

### How Arc Revolutionizes This:
On Circle's **Arc Mainnet**, **USDC is the native gas asset** (18 decimals for native transfers). 
- **1-Click Native Checkout**: When a user unlocks a gate or tips a creator on ArcGate, they pay directly via `msg.value` in native USDC.
- **Zero Token Approvals**: Zero prior approvals required. The transaction settles in under 1 second.
- **99% Direct Creator Payout**: 99% of each micro-payment is routed directly into the creator's wallet on-chain instantaneously.

---

## 🏛️ System Architecture

```
                                +---------------------------+
                                |      Creator / Buyer      |
                                +-------------+-------------+
                                              |
                                     (Connects MetaMask)
                                              |
                                              v
               +-------------------------------------------------------------+
               |                       ArcGate Frontend                      |
               |                (Vite + React + Tailwind CSS)                |
               |         Auto-Switches to Arc Mainnet (Chain ID 5042)        |
               +------------------------------+------------------------------+
                                              |
                               (RPC: https://rpc.mainnet.arc.io)
                                              |
                                              v
               +-------------------------------------------------------------+
               |                   ArcPaywall.sol Contract                   |
               |                     (Arc Mainnet L1)                        |
               +------------------------------+------------------------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
    +---------------------------------+               +---------------------------------+
    |          createGate()           |               |          unlockGate()           |
    | - Stores title, description     |               | - Verifies native USDC msg.value|
    | - Encrypts/hides secret payload |               | - Grants instant access         |
    | - Sets custom USDC price        |               | - 99% forwarded to creator      |
    +---------------------------------+               +---------------------------------+
```

---

## 📜 Smart Contract Specs (`ArcPaywall.sol`)

- **Network**: Arc Mainnet (Chain ID: `5042` / `0x13b2`)
- **Native Currency**: `USDC` (18 decimals)
- **Functions**:
  - `createGate(string title, string description, string secretPayload, uint256 priceUsdcWei)`: Creates a new paywalled secret gate.
  - `unlockGate(uint256 gateId) payable`: Unlocks a gate by sending the required native USDC fee.
  - `tipCreator(address payable creator, string message) payable`: Sends a direct P2P USDC tip with an on-chain thank-you message.
  - `getGate(uint256 gateId)`: Returns public metadata, but only reveals `secretPayload` if the caller has unlocked the gate.
  - `getRecentGates(uint256 offset, uint256 limit)`: Fetches paginated gates for the frontend without external indexers.
  - `getProtocolStats()`: Returns real-time analytics (total volume, unlocks, gates created).

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
1. Initialize git and push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: ArcGate micro-paywall protocol on Arc Mainnet"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/arc-paywall-dapp.git
   git push -u origin main
   ```
2. Go to [Vercel](https://vercel.com) $\to$ **Add New Project** $\to$ Import your `arc-paywall-dapp` repository.
3. Click **Deploy**. Your dApp will be live in 30 seconds!

---

## 📝 Pre-Written DoraHacks Arc Microgrants Submission Copy

Use this exact text when filling out your DoraHacks submission form at [dorahacks.io/hackathon/arc-microgrants/detail](https://dorahacks.io/hackathon/arc-microgrants/detail):

### Project Name:
`ArcGate — Native USDC Micro-Paywall & Tipping Protocol`

### Tagline:
`Decoupled creator micro-monetization powered by Circle's Arc Mainnet native USDC gas.`

### Problem Statement:
Existing subscription models ($10-$30/month) force users into all-or-nothing commitments for single pieces of content. Furthermore, on traditional EVM networks, sending micro-payments in USDC requires paying gas in ETH and performing 2-step ERC-20 approvals (`approve` then `transferFrom`), making sub-$1 transactions economically unviable.

### Solution:
ArcGate leverages Circle's newly launched **Arc Mainnet**, where **USDC is the native gas asset**. By utilizing native transfers (`msg.value`), ArcGate enables 1-click instant unlock of digital assets (research alpha, secret links, private Discord/Telegram invites, code repositories) for as low as $0.05 USDC with zero token approvals and sub-second settlement.

### Key Features:
- **Instant 1-Click Paywalled Secrets**: Creators define content and unlock prices in USDC.
- **Direct P2P Micro-Tipping**: Send on-chain USDC tips with custom messages to any creator.
- **99% Direct Creator Revenue**: Immediate on-chain distribution upon unlock.
- **Auto Arc Network Onboarding**: Seamless 1-click MetaMask network switcher for Chain ID 5042.

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
