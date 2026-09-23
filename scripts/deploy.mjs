import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

const ARC_RPC_URL = 'https://rpc.mainnet.arc.io';
const CHAIN_ID = 5042;

async function main() {
  let envKey = process.env.PRIVATE_KEY;
  if (!envKey) {
    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
      const envText = fs.readFileSync(envPath, 'utf8');
      const match = envText.match(/^\s*PRIVATE_KEY\s*=\s*(["']?)(.*?)\1\s*$/m);
      if (match && match[2]) {
        envKey = match[2].trim();
      }
    }
  }

  const privateKey = envKey || process.argv[2];

  if (!privateKey) {
    console.error('❌ Error: No private key provided.');
    console.log('\nUsage:');
    console.log('  node scripts/deploy.mjs <YOUR_PRIVATE_KEY>');
    console.log('  OR set PRIVATE_KEY in .env');
    process.exit(1);
  }

  const cleanKey = privateKey.trim().startsWith('0x')
    ? privateKey.trim()
    : '0x' + privateKey.trim();

  console.log('⚡ Connecting to Arc Mainnet (Chain ID 5042)...');
  const provider = new ethers.JsonRpcProvider(ARC_RPC_URL, {
    chainId: CHAIN_ID,
    name: 'Arc Mainnet',
  });

  const wallet = new ethers.Wallet(cleanKey, provider);
  console.log(`🔑 Deployer Address: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  const formattedBalance = ethers.formatUnits(balance, 18);
  console.log(`💰 Native USDC Balance: ${formattedBalance} USDC`);

  if (balance === 0n) {
    console.error('❌ Insufficient funds: The deployer wallet has 0 USDC for gas fees.');
    console.log('Please send a fraction of USDC (e.g. 0.05 USDC) to this address on Arc Mainnet.');
    process.exit(1);
  }

  const artifactPath = path.resolve('contracts', 'ArcPaywall.json');
  if (!fs.existsSync(artifactPath)) {
    console.error('❌ Error: contracts/ArcPaywall.json not found. Run "node scripts/compile.mjs" first.');
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  console.log('🚀 Deploying ArcPaywall contract to Arc Mainnet...');

  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();

  console.log(`⏳ Broadcasted deployment tx: ${contract.deploymentTransaction().hash}`);
  console.log('Waiting for confirmation on Arc Mainnet...');
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log('\n======================================================');
  console.log('🎉 CONTRACT DEPLOYED SUCCESSFULLY TO ARC MAINNET!');
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔍 ArcScan Explorer: https://explorer.arc.io/address/${contractAddress}`);
  console.log('======================================================\n');

  // Auto-update src/config.js
  const configPath = path.resolve('src', 'config.js');
  let configContent = fs.readFileSync(configPath, 'utf8');
  configContent = configContent.replace(
    /export const ARC_PAYWALL_CONTRACT_ADDRESS = ['"].*?['"];/,
    `export const ARC_PAYWALL_CONTRACT_ADDRESS = '${contractAddress}';`
  );
  fs.writeFileSync(configPath, configContent);
  console.log(`✓ Updated src/config.js with new contract address: ${contractAddress}`);
}

main().catch((err) => {
  console.error('❌ Deployment failed:', err);
  process.exit(1);
});
