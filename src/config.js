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
// After deploying via Remix, replace this address with your deployed contract address!
export const ARC_PAYWALL_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// Smart Contract ABI
export const ARC_PAYWALL_ABI = [
  'function createGate(string calldata title, string calldata description, string calldata secretPayload, uint256 priceUsdcWei) external returns (uint256)',
  'function unlockGate(uint256 gateId) external payable',
  'function tipCreator(address payable creator, string calldata message) external payable',
  'function getGate(uint256 gateId) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 priceUsdcWei, uint256 unlockCount, uint256 createdAt, bool active, bool isUnlocked, string secretPayload))',
  'function getRecentGates(uint256 offset, uint256 limit) external view returns (tuple(uint256 id, address creator, string title, string description, uint256 priceUsdcWei, uint256 unlockCount, uint256 createdAt, bool active, bool isUnlocked, string secretPayload)[])',
  'function getProtocolStats() external view returns (uint256 totalGates, uint256 totalUnlocks, uint256 totalTips, uint256 totalVolume)',
  'function gateCount() external view returns (uint256)',
  'function totalVolumeUsdc() external view returns (uint256)',
  'function totalUnlocksCount() external view returns (uint256)',
  'function totalTipsCount() external view returns (uint256)',
  'event GateCreated(uint256 indexed id, address indexed creator, string title, uint256 priceUsdcWei, uint256 timestamp)',
  'event GateUnlocked(uint256 indexed id, address indexed buyer, address indexed creator, uint256 amountPaid, uint256 timestamp)',
  'event CreatorTipped(address indexed creator, address indexed tipper, uint256 amount, string message, uint256 timestamp)',
];

// Curated Showcase Demo Gates for instant demo interaction
export const DEMO_GATES = [
  {
    id: 1,
    creator: '0x32A4B8F3C7E1d2A3bB0A4F8a18B0971b3e1B86C4',
    title: 'Circle Arc Alpha: Developer Secrets & Architecture Blueprint',
    description: 'Exclusive research notes on Arc sub-second finality, 18-decimal native gas mechanics, and institutional validator topology.',
    priceUsdcWei: '100000000000000000', // 0.10 USDC
    priceUsdcFormatted: '0.10',
    unlockCount: 0,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 2,
    active: true,
    isUnlocked: false,
    secretPayload: 'https://docs.arc.io/secret-alpha/arc-architecture-spec-v1.pdf\nPasscode: ARC_500_GRANT_WINNER',
  },
  {
    id: 2,
    creator: '0x8b3192f5eE8b2756882F38436FDE015b6dEb4827',
    title: 'Private Telegram Alpha Channel: Crypto Quant Signals',
    description: 'Instant invite link to the private 2026 algorithmic DeFi signals channel. Micro-monetized with zero friction.',
    priceUsdcWei: '250000000000000000', // 0.25 USDC
    priceUsdcFormatted: '0.25',
    unlockCount: 0,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 4,
    active: true,
    isUnlocked: false,
    secretPayload: 'https://t.me/+ArcQuantAlphaVipInvite_77x9qZ',
  },
  {
    id: 3,
    creator: '0x5D22b647F8B67C9242944b1c753F8FfB4bFa19a2',
    title: 'Full-Stack Web3 Starter Kit (React + Solidity + Arc RPC)',
    description: 'Production-ready codebase template with preconfigured MetaMask auto-switch, ArcScan verification scripts, and Vercel CI/CD.',
    priceUsdcWei: '500000000000000000', // 0.50 USDC
    priceUsdcFormatted: '0.50',
    unlockCount: 0,
    createdAt: Math.floor(Date.now() / 1000) - 86400 * 6,
    active: true,
    isUnlocked: false,
    secretPayload: 'https://github.com/arc-ecosystem/arc-starter-kit-private\nAccess Token: ghp_arcNativeStablecoinMasterKey2026',
  },
];
