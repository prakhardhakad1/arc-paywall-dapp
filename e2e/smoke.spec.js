import { test, expect, request } from '@playwright/test';

const LIVE_API = 'https://arc-paywall-dapp.vercel.app';

// The sandbox reaches the public internet through an egress proxy that the
// Playwright request client does not pick up on its own; pass it explicitly.
async function liveApi() {
  return request.newContext({
    proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
  });
}

test.describe('ArcGate smoke', () => {
  test('homepage loads with hero and no fatal errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /1-Click Paywalls/i })).toBeVisible();
    await expect(page.getByText('Live Mainnet').first()).toBeVisible();
    expect(errors.filter((m) => !/metamask|ethereum/i.test(m))).toEqual([]);
  });

  test('sandbox unlock reveals a receipt', async ({ page }) => {
    await page.goto('/');
    // Switch to sandbox mode (zero wallet friction)
    await page.getByRole('button', { name: 'Sandbox' }).click();
    await expect(page.getByText(/Sandbox Mode/i).first()).toBeVisible();

    // Click the first enabled "Unlock" gate button (skip paused gates)
    const unlockBtn = page
      .locator('button', { hasText: 'Unlock' })
      .filter({ hasNotText: 'Unlocked' })
      .first();
    await unlockBtn.scrollIntoViewIfNeeded();
    await unlockBtn.click();

    // Receipt modal appears with a receipt id
    await expect(page.getByText('Receipt ID')).toBeVisible({ timeout: 15000 });
  });

  test('live API: /api/gate/4 returns 402 with numeric on-chain price', async () => {
    const api = await liveApi();
    const res = await api.get(`${LIVE_API}/api/gate/4`);
    expect(res.status()).toBe(402);
    const body = await res.json();
    expect(body.priceSource).toBe('on-chain');
    expect(/^\d+$/.test(body.priceWei)).toBe(true);
    expect(body.contractAddress).toBe('0x59a2f8f63cf6a2F918d8299a4B999341A1fC9620');
    expect(res.headers()['x-arc-chain-id']).toBe('5042');
    await api.dispose();
  });

  test('live API: paused gate returns 404', async () => {
    const api = await liveApi();
    const res = await api.get(`${LIVE_API}/api/gate/5`);
    expect(res.status()).toBe(404);
    await api.dispose();
  });

  test('live API: unknown gate returns 404', async () => {
    const api = await liveApi();
    const res = await api.get(`${LIVE_API}/api/gate/999`);
    expect(res.status()).toBe(404);
    await api.dispose();
  });

  test('live API: /api/unlock without signature returns 401', async () => {
    const api = await liveApi();
    const res = await api.post(`${LIVE_API}/api/unlock`, {
      data: {
        gate_id: 4,
        tx_hash: '0x402097058faf2179a60a98996d9e4fca44e8e5817d04cc87579a631a35803e0d',
      },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toMatch(/signature/i);
    await api.dispose();
  });

  test('live API: x402 is off by default — no PAYMENT-REQUIRED header on gate 4', async () => {
    const api = await liveApi();
    const res = await api.get(`${LIVE_API}/api/gate/4`);
    expect(res.status()).toBe(402);
    expect(res.headers()['payment-required']).toBeUndefined();
    const body = await res.json();
    expect(body.x402.enabled).toBe(false);
    await api.dispose();
  });

  test('live API: x402 settings endpoint reports gate 4 as disabled', async () => {
    const api = await liveApi();
    const res = await api.get(`${LIVE_API}/api/x402-settings?gate_ids=4`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.settings['4']).toBe(false);
    await api.dispose();
  });

  test('live API: x402 payment to a non-enabled gate fails closed with 402', async () => {
    const api = await liveApi();
    const fakePayload = Buffer.from(
      JSON.stringify({
        x402Version: 2,
        scheme: 'exact',
        network: 'eip155:5042',
        payload: {
          signature: '0x00',
          authorization: {
            from: '0x1111111111111111111111111111111111111111',
            to: '0x2222222222222222222222222222222222222222',
            value: '100000',
            validAfter: '0',
            validBefore: String(Math.floor(Date.now() / 1000) + 300),
            nonce: '0xtest',
          },
        },
      })
    ).toString('base64');
    const res = await api.post(`${LIVE_API}/api/unlock`, {
      headers: { 'PAYMENT-SIGNATURE': fakePayload },
      data: { gate_id: 4 },
    });
    // Gate 4 has x402 disabled -> must fail closed, never verify/settle/serve.
    expect(res.status()).toBe(402);
    const body = await res.json();
    expect(body.error).toMatch(/not enabled/i);
    await api.dispose();
  });
});
