import { createClient } from '@libsql/client';

const url = "libsql://project2-prakhardhakad1.aws-ap-south-1.turso.io";
const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAwOTk1MzMsImlkIjoiMDFhMGNhM2UtYzkwMS03NjNjLWJjZDEtOWYyMzVmYTFiZmJjIiwia2lkIjoiUXo2Wmx2cnFxcE92OFFXcjdIbUl2S0RQbVB1UnlGVXJ1eThTdUd5S2YzYyIsInJpZCI6ImI2ZGQxOGE3LTkwMGMtNGY5ZS04ZDQ2LWVjZDg0M2ZmYWJjZCJ9.0tKkcRUXCLHKodvAMBvs_vmL6ZXp_hHD_hJ4ncK1Llj4Tqb5IjDTRMnQV-iFnvyFDZXOohVvuHm9HhygRm5TCA";

async function main() {
  console.log("Connecting to Turso database...");
  const client = createClient({ url, authToken });

  console.log("Creating tables in Turso cloud...");
  await client.execute(`
    CREATE TABLE IF NOT EXISTS gates (
      id INTEGER PRIMARY KEY,
      creator TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      encrypted_payload TEXT NOT NULL,
      price_usdc_wei TEXT NOT NULL,
      price_formatted REAL NOT NULL,
      unlock_count INTEGER DEFAULT 0,
      total_earned_usdc REAL DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS unlocks (
      id TEXT PRIMARY KEY,
      gate_id INTEGER NOT NULL,
      buyer_address TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      amount_paid_usdc REAL NOT NULL,
      unlocked_at INTEGER NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS tips (
      id TEXT PRIMARY KEY,
      creator_address TEXT NOT NULL,
      tipper_address TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      amount_usdc REAL NOT NULL,
      message TEXT,
      created_at INTEGER NOT NULL
    );
  `);

  console.log("Tables verified successfully! Querying sqlite_master...");
  const res = await client.execute("SELECT name FROM sqlite_master WHERE type='table';");
  console.log("Current tables in Turso:", res.rows.map(r => r.name));
  console.log("✅ Turso database is LIVE and configured!");
}

main().catch(console.error);
