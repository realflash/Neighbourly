const { test, expect } = require('@playwright/test');

test.describe('BUG-2604270844: Unclaim Color and Persistence', () => {
  const port = process.env.APP_PORT || 4567;
  const HIGH_PRIORITY_HEX = '#238443';
  const CLAIMED_BY_YOU_HEX = '#9d5fa7';

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`));
    
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.fill('input[name="email"]', 'user@attono.net');
    await page.evaluate(() => localStorage.setItem('helpSeen', 'true'));
    await page.click('input[value="Log In"]');
    
    if (await page.url().includes('user_details')) {
      await page.fill('input[name="user_details[first_name]"]', 'Standard');
      await page.fill('input[name="user_details[last_name]"]', 'User');
      await page.fill('input[name="user_details[phone]"]', '123456');
      await page.fill('input[name="user_details[postcode]"]', 'GU18 5TS');
      await page.click('input[value="Submit"]');
    }
    
    await page.waitForURL(`http://127.0.0.1:${port}/map`);
    await page.evaluate(() => window.leafletMap.setView([51.349, -0.676], 15));

    const dropdown = page.locator('#campaign');
    await dropdown.selectOption('1');
    await page.evaluate(() => {
        window.selectedCampaignId = '1';
        updateLeafletMap(true);
    });

    await page.waitForFunction(() => parseInt(document.body.getAttribute('data-update-count') || '0') >= 1);
    
    // Give it a bit more time for the layers to actually be rendered
    await page.waitForTimeout(2000);
  });

  test('Unclaiming a high priority area should show green immediately and persist after reload', async ({ page }) => {
    // 1. Find a meshblock and ensure it's high priority and claimed by us
    const slug = await page.evaluate(() => {
      console.log('CLIENT: Searching for slug...');
      const layers = Object.values(window.leafletMap._layers);
      console.log(`CLIENT: Total layers: ${layers.length}`);
      for (let layer of layers) {
        if (layer.feature && layer.feature.properties && layer.feature.properties.slug) {
            console.log(`CLIENT: Found slug ${layer.feature.properties.slug}`);
            return layer.feature.properties.slug;
        }
      }
      return null;
    });

    if (!slug) throw new Error("Could not find any meshblock slug on map");
    console.log(`Testing with slug: ${slug}`);

    // Setup state via API first to ensure we start from a clean 'claimed' state
    await page.evaluate(async ({ slug }) => {
        console.log(`CLIENT: Setting up state for ${slug}`);
        await fetch(`/claims/${slug}/priority`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ campaign_id: '1', priority: 'high' })
        });
        await fetch(`/claim_meshblock/${slug}?campaign_id=1`, { method: 'POST' });
        updateLeafletMap(true);
    }, { slug });

    await page.waitForFunction((s) => window.meshblockColors && window.meshblockColors[s] === '#9d5fa7', slug);
    console.log('Node: State confirmed as Purple');

    // 2. Open popup using coordinate click
    const point = await page.evaluate(async (s) => {
        const layer = Object.values(window.leafletMap._layers).find(l => l.feature?.properties?.slug === s);
        const center = layer.getBounds().getCenter();
        window.leafletMap.panTo(center, { animate: false });
        // Wait for pan to complete (next frame)
        await new Promise(r => setTimeout(r, 100));
        const p = window.leafletMap.latLngToContainerPoint(center);
        console.log(`CLIENT: Clicking at ${p.x}, ${p.y}`);
        return { x: p.x, y: p.y };
    }, slug);

    await page.click('#map', { position: { x: point.x, y: point.y } });
    console.log('Node: Map clicked at coordinates');

    await expect(page.locator('.leaflet-popup-content')).toBeVisible({ timeout: 10000 });
    console.log('Node: Popup visible');
    
    // 3. Click 'Unclaim' button in UI
    const unclaimBtn = page.locator('button[name="unclaim"]');
    await unclaimBtn.click();
    console.log('Node: Unclaim button clicked');

    // 4. Verify color changes to HIGH_PRIORITY_HEX (green) immediately
    await page.waitForFunction((s) => window.meshblockColors && window.meshblockColors[s] !== '#9d5fa7', slug);
    const colorAfterClick = await page.evaluate((s) => window.meshblockColors[s], slug);
    console.log(`Node: Color immediately after unclaim: ${colorAfterClick}`);
    
    // EXPECTED FAILURE: This will be #ffffcc (cream) instead of #238443 (green)
    expect(colorAfterClick).toBe(HIGH_PRIORITY_HEX);

    // 5. Reload and verify it's still green
    await page.reload();
    await page.waitForFunction(() => parseInt(document.body.getAttribute('data-update-count') || '0') >= 1);
    await page.waitForFunction((s) => window.meshblockColors && window.meshblockColors[s], slug);
    
    const colorAfterReload = await page.evaluate((s) => window.meshblockColors[s], slug);
    console.log(`Node: Color after reload: ${colorAfterReload}`);
    
    // EXPECTED FAILURE: This will be #9d5fa7 (purple) because DB wasn't updated
    expect(colorAfterReload).toBe(HIGH_PRIORITY_HEX);
  });
});
