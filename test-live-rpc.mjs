import { ethers } from 'ethers';
import { ARC_MAINNET, DEMO_GATES } from './src/config.js';

async function testRpc() {
  console.log('⚡ Testing Connection to Circle Arc Mainnet Live RPC...');
  const provider = new ethers.JsonRpcProvider(ARC_MAINNET.rpcUrl, {
    chainId: ARC_MAINNET.chainId,
    name: ARC_MAINNET.chainName,
  });

  const network = await provider.getNetwork();
  console.log(`✓ Network connected! Chain ID: ${network.chainId}`);

  const blockNumber = await provider.getBlockNumber();
  console.log(`✓ Latest Block Number: ${blockNumber}`);

  console.log('\nTesting Creator Addresses Checksum:');
  for (const gate of DEMO_GATES) {
    const raw = gate.creator;
    const checksummed = ethers.getAddress(raw.toLowerCase());
    console.log(`Gate #${gate.id}:`);
    console.log(`  Raw in config: ${raw}`);
    console.log(`  Valid checksum: ${checksummed}`);
    console.log(`  Matches?: ${raw === checksummed}`);
    
    const bal = await provider.getBalance(checksummed);
    console.log(`  Arc Balance: ${ethers.formatUnits(bal, 18)} USDC`);
  }
}

testRpc().catch(console.error);
