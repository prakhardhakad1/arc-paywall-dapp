import fs from 'fs';
import path from 'path';
import solc from 'solc';

const contractPath = path.resolve('contracts', 'ArcPaywall.sol');
const source = fs.readFileSync(contractPath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'ArcPaywall.sol': {
      content: source,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object'],
      },
    },
  },
};

console.log('Compiling ArcPaywall.sol with solc 0.8.20...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasError = false;
  for (const err of output.errors) {
    if (err.severity === 'error') {
      console.error('Compiler Error:', err.formattedMessage);
      hasError = true;
    } else {
      console.warn('Compiler Warning:', err.formattedMessage);
    }
  }
  if (hasError) {
    process.exit(1);
  }
}

const contract = output.contracts['ArcPaywall.sol']['ArcPaywall'];
const artifact = {
  contractName: 'ArcPaywall',
  abi: contract.abi,
  bytecode: contract.evm.bytecode.object,
};

fs.writeFileSync(
  path.resolve('contracts', 'ArcPaywall.json'),
  JSON.stringify(artifact, null, 2)
);

console.log('✓ Compilation successful! Artifact saved to contracts/ArcPaywall.json');
console.log(`Bytecode size: ${artifact.bytecode.length / 2} bytes`);
