// Arc Mainnet Network & Contract Configuration
export const ARC_MAINNET = {
  chainId: 5042,
  chainIdHex: '0x13b2',
  chainName: 'Arc Mainnet',
  rpcUrl: 'https://rpc.mainnet.arc.io',
  currency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  blockExplorer: 'https://explorer.arc.io',
};

// CONTRACT DEPLOYMENT ADDRESS ON ARC MAINNET
// After deploying via Remix or scripts/deploy.mjs, replace this address with your deployed contract address!
export const ARC_PAYWALL_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// Smart Contract ABI (Strictly synchronized with contracts/ArcPaywall.sol)
export const ARC_PAYWALL_ABI = [
  'function createGate(string calldata title, string calldata description, string calldata secretPayload, uint256 priceUsdcWei) external returns (uint256)',
  'function unlockGate(uint256 gateId) external payable',
  'function setGateActive(uint256 gateId, bool active) external',
  'function setGatePrice(uint256 gateId, uint256 newPriceUsdcWei) external',
  'function tipCreator(address payable creator, string calldata message) external payable',
  'function getGate(uint256 gateId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 priceUsdcWei, uint256 unlockCount, uint256 createdAt, bool active, bool isUnlocked, string secretPayload))',
  'function getRecentGates(uint256 offset, uint256 limit) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 priceUsdcWei, uint256 unlockCount, uint256 createdAt, bool active, bool isUnlocked, string secretPayload)[])',
  'function getProtocolStats() external view returns (uint256 totalGates, uint256 totalUnlocks, uint256 totalTips, uint256 totalVolume)',
  'function withdrawCreatorEarnings() external',
  'function pendingBalances(address creator) external view returns (uint256)',
  'function withdrawProtocolFees() external',
  'function protocolFeesAvailable() external view returns (uint256)',
  'function gateCount() external view returns (uint256)',
  'function totalVolumeUsdc() external view returns (uint256)',
  'function totalUnlocksCount() external view returns (uint256)',
  'function totalTipsCount() external view returns (uint256)',
  'event GateCreated(uint256 indexed id, address indexed creator, string title, uint256 priceUsdcWei, uint256 timestamp)',
  'event GateUnlocked(uint256 indexed id, address indexed buyer, address indexed creator, uint256 amountPaid, uint256 timestamp)',
  'event GateStatusChanged(uint256 indexed id, bool active)',
  'event GatePriceUpdated(uint256 indexed id, uint256 newPriceUsdcWei)',
  'event CreatorTipped(address indexed creator, address indexed tipper, uint256 amount, string message, uint256 timestamp)',
  'event CreatorPayoutWithdrawn(address indexed creator, uint256 amount)',
  'event ProtocolFeesWithdrawn(address indexed owner, uint256 amount)',
  'event ProtocolFeesFunded(address indexed sender, uint256 amount)',
];

// Curated Showcase Demo Gates with Client-Side AES-256-GCM Ciphertext Envelopes
// Zero plaintext credentials or passcodes exist in this file or client bundle.
export const DEMO_GATES = [
  {
    id: 1,
    creator: '0x32A4B8F3c7e1D2A3Bb0A4F8A18B0971b3E1B86C4',
    title: 'Circle Arc Alpha: Developer Secrets & Architecture Blueprint',
    description: 'Exclusive research notes on Arc sub-second finality, 18-decimal native gas mechanics, and institutional validator topology.',
    priceUsdcWei: '100000000000000000', // 0.10 USDC
    priceUsdcFormatted: '0.10',
    unlockCount: 0,
    createdAt: 1789948800, // Fixed historical launch date
    active: true,
    isUnlocked: false,
    secretPayload: 'enc:aes-gcm:eyJhbGciOiJBRVMtR0NNLTI1NiIsInNhbHQiOiJNcDZNcWZ5NmthSm0vR2tQV3hQeTVBPT0iLCJpdiI6IlN6NVFvUmJjZWxRclBHbEIiLCJkYXRhIjoiK0grRyt5T3c5WnVZWGd5enF2aStFamJmVklqa3VER25mZnhyNW5JRU9GNWJ5ZDErbE9DVHJvTTJVWGRzREV0dTJUTFJRV0MzdHNBdHowQ3dVQmNLRUNJU1BMU0ovaWNRN2hkc2dJZkdQUXZUdWpaeGlmb2pXenJDLzIyOU5GYU01VGpKVWZzR2ZsSzBTbzUrIn0=',
  },
  {
    id: 2,
    creator: '0x8b3192f5eE8b2756882F38436FDE015b6dEb4827',
    title: 'Private Telegram Alpha Channel: Crypto Quant Signals',
    description: 'Instant invite link to the private 2026 algorithmic DeFi signals channel. Micro-monetized with zero friction.',
    priceUsdcWei: '250000000000000000', // 0.25 USDC
    priceUsdcFormatted: '0.25',
    unlockCount: 0,
    createdAt: 1789776000, // Fixed historical launch date
    active: true,
    isUnlocked: false,
    secretPayload: 'enc:aes-gcm:eyJhbGciOiJBRVMtR0NNLTI1NiIsInNhbHQiOiJ4enNWbG9lRlU5N2hvVm9XYTZmemFBPT0iLCJpdiI6IjUydXhYTW5pZ3ZyWllZdzkiLCJkYXRhIjoiREJLSlg3ZnJ4WXRST1NCcmc0Mis3dFpxa3lIc3ZCRGtxMkRIZG94NUlFVVJrK3lxVzJmTFo0MXB5dHNMM3pQR3NaRk9NazY0RXF3aTJnTT0ifQ==',
  },
  {
    id: 3,
    creator: '0x5D22b647F8B67C9242944b1c753F8FfB4bFa19a2',
    title: 'Full-Stack Web3 Starter Kit (React + Solidity + Arc RPC)',
    description: 'Production-ready codebase template with preconfigured MetaMask auto-switch, ArcScan verification scripts, and Vercel CI/CD.',
    priceUsdcWei: '500000000000000000', // 0.50 USDC
    priceUsdcFormatted: '0.50',
    unlockCount: 0,
    createdAt: 1789603200, // Fixed historical launch date
    active: true,
    isUnlocked: false,
    secretPayload: 'enc:aes-gcm:eyJhbGciOiJBRVMtR0NNLTI1NiIsInNhbHQiOiJFeFh0SXE2U04vYm9sVERKNTFJU3ZnPT0iLCJpdiI6Ikw4NitzdHhkSkE4UXlOYlAiLCJkYXRhIjoiNDJDMVkrTTRlK0ZMbGhiRFYvS3hsKzdsN09hLytYcFNNaGNNUitMeGJhbFNWdmRDU1N3bGRuTFFYR2FqZkdJSFNydVIzUy96L2I2OGl1U0VSUkh1a25YSmFmVjZnRFJMWjZuMW9saTNmVHJ2TWlWcUZwbERiVlppajJ6bWkyc29ETkViR2R2Zk1OTHljM1RETXFFeFhoaXY5SE1nZjFsbm5UQS8ifQ==',
  },
];
