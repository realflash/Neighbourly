const { test, expect } = require('@playwright/test');

test.describe('Map Overlay Color Changes', () => {
  const port = process.env.APP_PORT || 4567;
  const HIGH_PRIORITY_HEX = '#238443';
  const LOW_PRIORITY_HEX = '#ffffcc';
  const CLAIMED_BY_YOU_HEX = '#9d5fa7'; // Purple
  const CLAIMED_OTHERS_HEX = '#d5545a'; // Red
  const COMPLETE_HEX = '#2171b5';      // Blue

  let selectedCampaignId = null;

  test.beforeEach(async ({ page }) => {
    // Clean up DB before each test to prevent state bleed
    const { execSync } = require('child_process');
    const dbUrl = process.env.TEST_DB_URL || 'postgres://postgres:password@127.0.0.1:5435/postgres';
    try {
        // If running inside a container, docker might not be available.
        // We try to use psql directly if TEST_DB_URL is provided, or docker exec if it's not.
        if (process.env.TEST_DB_URL) {
            execSync(`psql "${dbUrl}" -c "DELETE FROM claims;"`);
        } else {
            execSync('docker exec neighbourly-test-db psql -U postgres -d postgres -c "DELETE FROM claims;"');
        }
    } catch (e) {
        console.warn('DB cleanup failed (might be expected if not in isolated environment):', e.message);
    }

    page.on('console', msg => {
        const text = msg.text();
        process.stdout.write(`BROWSER ${msg.type().toUpperCase()}: ${text}\n`);
    });
    
    await page.goto(`http://127.0.0.1:${port}/`);
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.evaluate(() => localStorage.setItem('helpSeen', 'true'));
    await page.click('input[value="Log In"]');
    
    if (await page.url().includes('user_details')) {
      await page.fill('input[name="user_details[first_name]"]', 'Admin');
      await page.fill('input[name="user_details[last_name]"]', 'User');
      await page.fill('input[name="user_details[phone]"]', '123456');
      await page.fill('input[name="user_details[postcode]"]', 'GU18 5TS');
      await page.click('input[value="Submit"]');
    }
    
    await page.waitForURL(`http://127.0.0.1:${port}/map`);
    await page.evaluate(() => window.leafletMap.setView([51.349, -0.676], 15));

    const dropdown = page.locator('#campaign');
    await dropdown.selectOption('1');
    selectedCampaignId = '1'; // Set in test scope
    await page.evaluate(() => {
        window.selectedCampaignId = '1';
        updateLeafletMap(true);
    });

    // Initial load should now reach count 1
    await page.waitForFunction(() => parseInt(document.body.getAttribute('data-update-count') || '0') >= 1, { timeout: 30000 });
    console.log('Node: Initial load complete');
  });

  async function getTargetSlug(page) {
    const slug = await page.evaluate(() => {
      for (let id in window.leafletMap._layers) {
        const layer = window.leafletMap._layers[id];
        if (layer.feature && layer.feature.properties && layer.feature.properties.slug) {
            console.log(`Found target slug: ${layer.feature.properties.slug}`);
            return layer.feature.properties.slug;
        }
      }
      return null;
    });
    console.log(`Node: getTargetSlug returned ${slug}`);
    return slug;
  }

  async function getLayerColor(page, slug) {
    const color = await page.evaluate((s) => {
        return window.meshblockColors ? window.meshblockColors[s] : null;
    }, slug);
    console.log(`Node: getLayerColor for ${slug} result: ${color}`);
    return color;
  }

  async function waitForColor(page, slug, expectedColor) {
    console.log(`Node: Waiting for ${slug} to be ${expectedColor}`);
    await page.waitForFunction(({ s, c }) => {
        return window.meshblockColors && window.meshblockColors[s] === c;
    }, { s: slug, c: expectedColor }, { timeout: 10000 });
    console.log(`Node: Color ${expectedColor} matched for ${slug}`);
  }

  async function apiPostBrowser(page, url, data) {
    const currentCount = await page.evaluate(() => parseInt(document.body.getAttribute('data-update-count') || '0'));
    console.log(`Node: API POST (Browser) to ${url} (currentCount=${currentCount})`);
    
    await page.evaluate(async ({ url, data }) => {
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data)
        });
        if (!resp.ok) throw new Error(`POST FAILED: ${resp.status}`);
        updateLeafletMap(true);
    }, { url, data });

    // Wait for the attribute to increment
    await page.waitForFunction((old) => parseInt(document.body.getAttribute('data-update-count') || '0') > old, currentCount, { timeout: 15000 });
    console.log(`Node: Map update detected`);
  }

  test('Unclaimed area changes colour when its priority is changed from high to low', async ({ page }) => {
    const slug = await getTargetSlug(page);
    await apiPostBrowser(page, `/unclaim_meshblock/${slug}`, { campaign_id: selectedCampaignId });
    
    await apiPostBrowser(page, `/claims/${slug}/priority`, { campaign_id: selectedCampaignId, priority: 'high' });
    await waitForColor(page, slug, HIGH_PRIORITY_HEX);

    await apiPostBrowser(page, `/claims/${slug}/priority`, { campaign_id: selectedCampaignId, priority: 'low' });
    await waitForColor(page, slug, LOW_PRIORITY_HEX);
  });

  test('Unclaimed area changes colour when its priority is changed from low to high', async ({ page }) => {
    const slug = await getTargetSlug(page);
    await apiPostBrowser(page, `/unclaim_meshblock/${slug}`, { campaign_id: selectedCampaignId });

    await apiPostBrowser(page, `/claims/${slug}/priority`, { campaign_id: selectedCampaignId, priority: 'low' });
    await waitForColor(page, slug, LOW_PRIORITY_HEX);

    await apiPostBrowser(page, `/claims/${slug}/priority`, { campaign_id: selectedCampaignId, priority: 'high' });
    await waitForColor(page, slug, HIGH_PRIORITY_HEX);
  });

  test('Low priority claimed area changes to the correct colour when the claim is released', async ({ page }) => {
    const slug = await getTargetSlug(page);
    await apiPostBrowser(page, `/unclaim_meshblock/${slug}`, { campaign_id: selectedCampaignId });

    await apiPostBrowser(page, `/claims/${slug}/priority`, { campaign_id: selectedCampaignId, priority: 'low' });
    await apiPostBrowser(page, `/claim_meshblock/${slug}`, { campaign_id: selectedCampaignId });
    await waitForColor(page, slug, CLAIMED_BY_YOU_HEX);

    await apiPostBrowser(page, `/unclaim_meshblock/${slug}`, { campaign_id: selectedCampaignId });
    await waitForColor(page, slug, LOW_PRIORITY_HEX);
  });

  test('High priority claimed area changes to the correct colour when the claim is released', async ({ page }) => {
    const slug = await getTargetSlug(page);
    await apiPostBrowser(page, `/unclaim_meshblock/${slug}`, { campaign_id: selectedCampaignId });

    await apiPostBrowser(page, `/claims/${slug}/priority`, { campaign_id: selectedCampaignId, priority: 'high' });
    await apiPostBrowser(page, `/claim_meshblock/${slug}`, { campaign_id: selectedCampaignId });
    await waitForColor(page, slug, CLAIMED_BY_YOU_HEX);

    await apiPostBrowser(page, `/unclaim_meshblock/${slug}`, { campaign_id: selectedCampaignId });
    await waitForColor(page, slug, HIGH_PRIORITY_HEX);
  });
  
  test('Area claimed by another admin shows as claimed (red) not complete (blue)', async ({ page }) => {
    const slug = await getTargetSlug(page);
    
    // Ensure area is unclaimed first
    await apiPostBrowser(page, `/unclaim_meshblock/${slug}`, { campaign_id: selectedCampaignId });

    // Manually inject a claim by ANOTHER admin into the database
    const { execSync } = require('child_process');
    const dbUrl = process.env.TEST_DB_URL || 'postgres://postgres:password@127.0.0.1:5435/postgres';
    execSync(`psql "${dbUrl}" -c "DELETE FROM claims WHERE mesh_block_slug = '${slug}' AND campaign_id = ${selectedCampaignId};"`);
    execSync(`psql "${dbUrl}" -c "INSERT INTO claims (mesh_block_slug, mesh_block_claimer, campaign_id, status, priority, claim_date) VALUES ('${slug}', 'other_admin@example.com', ${selectedCampaignId}, 'claimed', 'high', NOW());"`);

    // Trigger map update to see the new state
    await page.evaluate(() => updateLeafletMap(true));
    
    // It should be RED (CLAIMED_OTHERS_HEX)
    await waitForColor(page, slug, CLAIMED_OTHERS_HEX);
  });
});
