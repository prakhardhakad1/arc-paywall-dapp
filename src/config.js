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
// Set VITE_ARC_PAYWALL_ADDRESS at build time (see scripts/deploy.mjs output).
// When unset, the app runs in honest Standby mode and refuses live unlocks.
export const ARC_PAYWALL_CONTRACT_ADDRESS =
  import.meta.env?.VITE_ARC_PAYWALL_ADDRESS || '0x0000000000000000000000000000000000000000';

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
    secretPayload: 'enc:aes-gcm:eyJhbGciOiJBRVMtR0NNLTI1NiIsIml2IjoiazRpSU1XMzlWSS9ONEVmciIsImRhdGEiOiJqQjF5QVBHR3l3TFlBVGZURVU3d2g2ZEZqcFQxeExSNXVTRitiY1IwY3BvNXkxdkhLQlRUd09ScUhvRE1JdGxlVld5aFA4Vjk3NkZPbW9kRUV6NXZqV0xnaXIwRWtBRHg5SWRiVWJOMjByb3Boc0pvY3NZRlRXdGkyVWFVTkJBdlQ5UkFPN0FvdXl1ekc3WnkifQ==',
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
    secretPayload: 'enc:aes-gcm:eyJhbGciOiJBRVMtR0NNLTI1NiIsIml2IjoiVlNWaGdQbUNoWXN1N3IwQiIsImRhdGEiOiJidWgxcmc1ZG9md1dlVjgrS0Y2ajEyK1RkNUtCUzhMMEwxMk5tb3I0ZFppWDltaVhFMWlIU1ZRMzcyNGVXTnRHN21SOEtoYnEydVg2RlgwPSJ9',
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
    secretPayload: 'enc:aes-gcm:eyJhbGciOiJBRVMtR0NNLTI1NiIsIml2IjoiV2U0VGsvVEM5aUc5VXJ0MSIsImRhdGEiOiJVREZkQnFtWjlOSzdnZm1CQi9oZzFaQkNDVGIvRVZ4SThhVkFReElyNGxZN3UzNDBOZDFzc0RveTgvTDVxaXVSNDJsU3IvMDJVc3ZiT0IvRGVlQ3gxanNZcEpJVVNvOEo5ekhKQnBHU2l5ZG53M2pDV2MzdWNSY0xNcFNwNlRXUkZNWEM5MnlMVWl5VSthM2VFYVJySEgxU0xQeGRMYkxqUHFUSzc3YjJHUm9EMjhzU3VtSzVQRFNpVFlQeDJBPT0ifQ==',
  },
];
