# Verify ArcPaywall on the Arc explorer

The deployed contract can be verified (source matched to bytecode) in about two minutes.

- **Address:** `0x59a2f8f63cf6a2F918d8299a4B999341A1fC9620`
- **Explorer:** https://explorer.arc.io/address/0x59a2f8f63cf6a2F918d8299a4B999341A1fC9620

## Option A — Standard JSON upload (fastest)

1. Open the explorer link → **Contract** tab → **Verify & Publish**.
2. Choose **Solidity (Standard JSON input)**.
3. Upload `contracts/standard-json-input.json`.
4. Compiler: **v0.8.20+commit.a1b79de6**, license **MIT**, no constructor arguments.
5. Submit.

## Option B — single-file verification

1. Same page → **Solidity (Single file)**.
2. Contract name: `ArcPaywall`; compiler **v0.8.20+commit.a1b79de6**; license **MIT**.
3. Optimization: **enabled**, runs **200**.
4. Paste the entire contents of `contracts/ArcPaywall.sol`.
5. Constructor arguments: leave empty (the constructor takes none).

## Why these exact settings

`scripts/compile.mjs` compiled the deployed artifact with solc 0.8.20, optimizer enabled at 200 runs, source path `ArcPaywall.sol`. The metadata hash embedded in the deployed bytecode depends on that path and those settings, so they must match exactly for verification to succeed.

If the explorer reports a mismatch, copy the exact error text — the inputs here can be regenerated quickly to match.
