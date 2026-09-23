import { createClient } from '@libsql/client/web';

const tursoUrl = import.meta.env.VITE_TURSO_DATABASE_URL || 'libsql://project2-prakhardhakad1.aws-ap-south-1.turso.io';
const tursoToken = import.meta.env.VITE_TURSO_AUTH_TOKEN || '';

let tursoClient = null;
try {
  if (tursoUrl && tursoToken) {
    tursoClient = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
  }
} catch (e) {
  console.warn('Turso client initialization fallback to local:', e);
}

const STORAGE_KEY = 'arcgate_analytics_v1';

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
  async recordGateView(gateId) {
    // 1. Local fast update
    const data = getStoredAnalytics();
    data.views[gateId] = (data.views[gateId] || 0) + 1;
    saveStoredAnalytics(data);

    // 2. Cloud Turso update
    if (tursoClient) {
      try {
        await tursoClient.execute({
          sql: `UPDATE gates SET views_count = views_count + 1 WHERE id = ?`,
          args: [gateId],
        });
      } catch (err) {
        // Non-blocking fallback
      }
    }

    return data.views[gateId];
  },

  /**
   * Record on-chain unlock event
   */
  async recordUnlock(gateId, buyer, amountUsdc, txHash) {
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

    if (tursoClient) {
      try {
        await tursoClient.execute({
          sql: `INSERT OR REPLACE INTO unlocks (id, gate_id, buyer_address, tx_hash, amount_paid_usdc, unlocked_at) VALUES (?, ?, ?, ?, ?, ?)`,
          args: [
            `${gateId}-${buyer}-${Date.now()}`,
            gateId,
            buyer,
            txHash || '0xsimulated',
            parseFloat(amountUsdc || 0),
            Math.floor(Date.now() / 1000),
          ],
        });
      } catch (err) {
        console.warn('Turso unlock record error:', err);
      }
    }
  },

  /**
   * Record creator tip
   */
  async recordTip(creator, tipper, amountUsdc, message, txHash) {
    if (tursoClient) {
      try {
        await tursoClient.execute({
          sql: `INSERT INTO tips (id, creator_address, tipper_address, tx_hash, amount_usdc, message, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `tip-${Date.now()}`,
            creator,
            tipper,
            txHash || '0xsimulated',
            parseFloat(amountUsdc || 0),
            message || '',
            Math.floor(Date.now() / 1000),
          ],
        });
      } catch (err) {
        console.warn('Turso tip record error:', err);
      }
    }
  },

  /**
   * Get analytics for a specific gate
   */
  getGateStats(gateId, defaultUnlockCount = 0, priceUsdc = 0.1) {
    const data = getStoredAnalytics();
    const views = data.views[gateId] !== undefined ? data.views[gateId] : defaultUnlockCount;
    const localEarnings = data.earnings[gateId] !== undefined 
      ? data.earnings[gateId] 
      : (defaultUnlockCount * priceUsdc);
    const conv = views > 0 
      ? ((defaultUnlockCount / views) * 100).toFixed(1) 
      : (defaultUnlockCount > 0 ? '100.0' : '0.0');
    return {
      views,
      totalEarnedUsdc: localEarnings.toFixed(2),
      conversion: conv,
      conversionRate: conv,
    };
  },

  isLiveCloudConnected() {
    return Boolean(tursoClient);
  }
};
