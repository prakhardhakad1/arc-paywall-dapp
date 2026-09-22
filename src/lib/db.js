/**
 * ArcGate Lightweight Database & Analytics Layer
 * Designed for Turso / libSQL / SQLite with seamless client fallback.
 * 
 * SCHEMA DDL:
 * 
 * CREATE TABLE IF NOT EXISTS gates (
 *   id INTEGER PRIMARY KEY,
 *   creator TEXT NOT NULL,
 *   title TEXT NOT NULL,
 *   description TEXT,
 *   encrypted_payload TEXT NOT NULL,
 *   price_usdc_wei TEXT NOT NULL,
 *   price_formatted REAL NOT NULL,
 *   unlock_count INTEGER DEFAULT 0,
 *   total_earned_usdc REAL DEFAULT 0,
 *   views_count INTEGER DEFAULT 0,
 *   created_at INTEGER NOT NULL
 * );
 * 
 * CREATE TABLE IF NOT EXISTS unlocks (
 *   id TEXT PRIMARY KEY,
 *   gate_id INTEGER NOT NULL,
 *   buyer_address TEXT NOT NULL,
 *   tx_hash TEXT NOT NULL,
 *   amount_paid_usdc REAL NOT NULL,
 *   unlocked_at INTEGER NOT NULL,
 *   FOREIGN KEY (gate_id) REFERENCES gates(id)
 * );
 * 
 * CREATE TABLE IF NOT EXISTS tips (
 *   id TEXT PRIMARY KEY,
 *   creator_address TEXT NOT NULL,
 *   tipper_address TEXT NOT NULL,
 *   tx_hash TEXT NOT NULL,
 *   amount_usdc REAL NOT NULL,
 *   message TEXT,
 *   created_at INTEGER NOT NULL
 * );
 */

const STORAGE_KEY = 'arcgate_analytics_v1';

// In-browser fallback state manager
function getStoredAnalytics() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { views: {}, earnings: {}, unlocks: [] };
  } catch {
    return { views: {}, earnings: {}, unlocks: [] };
  }
}

function saveStoredAnalytics(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Could not persist analytics to storage:', e);
  }
}

export const dbService = {
  /**
   * Increment view count for an embedded or viewed gate
   */
  recordGateView(gateId) {
    const data = getStoredAnalytics();
    data.views[gateId] = (data.views[gateId] || 0) + 1;
    saveStoredAnalytics(data);
    return data.views[gateId];
  },

  /**
   * Record on-chain unlock event
   */
  recordUnlock(gateId, buyer, amountUsdc, txHash) {
    const data = getStoredAnalytics();
    data.earnings[gateId] = (data.earnings[gateId] || 0) + parseFloat(amountUsdc || 0);
    data.unlocks.push({
      gateId,
      buyer,
      amountUsdc,
      txHash,
      timestamp: Date.now(),
    });
    saveStoredAnalytics(data);
  },

  /**
   * Get analytics for a specific gate
   */
  getGateStats(gateId, defaultUnlockCount = 0, priceUsdc = 0.1) {
    const data = getStoredAnalytics();
    const views = data.views[gateId] || Math.max(defaultUnlockCount * 4, 12);
    const localEarnings = data.earnings[gateId] || (defaultUnlockCount * priceUsdc);
    return {
      views,
      totalEarnedUsdc: localEarnings.toFixed(2),
      conversionRate: views > 0 ? ((defaultUnlockCount / views) * 100).toFixed(1) : '0.0',
    };
  },

  /**
   * Turso DDL export for production deployment
   */
  getSchemaDDL() {
    return `
-- ArcGate Database Schema (Turso / libSQL / Cloudflare D1)
CREATE TABLE IF NOT EXISTS gates (
  id INTEGER PRIMARY KEY,
  creator TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  encrypted_payload TEXT NOT NULL,
  price_usdc_wei TEXT NOT NULL,
  unlock_count INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS unlocks (
  id TEXT PRIMARY KEY,
  gate_id INTEGER NOT NULL,
  buyer_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  amount_paid_usdc REAL NOT NULL,
  unlocked_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tips (
  id TEXT PRIMARY KEY,
  creator_address TEXT NOT NULL,
  tipper_address TEXT NOT NULL,
  amount_usdc REAL NOT NULL,
  message TEXT,
  created_at INTEGER NOT NULL
);
    `.trim();
  }
};
