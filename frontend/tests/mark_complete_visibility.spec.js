const { test, expect } = require('@playwright/test');

test.describe('Mark Complete Button Visibility', () => {
  test('button visibility workflow', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    
    // 0. Clean up DB
    const { execSync } = require('child_process');
    execSync('docker exec neighbourly-test-db psql -U postgres -d postgres -c "DELETE FROM claims WHERE mesh_block_slug = \'E00180604\';"');

    // 1. Login
    await page.goto('/login?email=user@example.com');
    
    // Check if we are on user_details or already on map
    const url = page.url();
    if (url.includes('user_details')) {
        await page.fill('input[name="user_details[first_name]"]', 'Standard');
        await page.fill('input[name="user_details[last_name]"]', 'User');
        await page.fill('input[name="user_details[phone]"]', '123456');
        await page.fill('input[name="user_details[postcode]"]', '1234');
        await page.click('input[type="submit"]');
        await page.waitForURL('**/map**');
    }
    await page.waitForLoadState('networkidle');
    
    // 2. Select Campaign
    await page.waitForSelector('#campaign option[value="1"]', { state: 'attached', timeout: 10000 });
    await page.evaluate(() => {
        // Close FAQ dialog if it exists
        if (window.$ && window.$.fn && window.$.fn.dialog && $('#dialog').length) {
            $('#dialog').dialog('close');
        }
        $('#campaign').val('1').trigger('change');
    });
    
    // 3. Zoom into target area
    await page.evaluate(() => {
      window.leafletMap.setView([51.348, -0.675], 15);
      window.updateLeafletMap(true);
    });
    
    // Wait for meshblocks to load
    await page.waitForFunction(() => window.meshblockColors && window.meshblockColors['E00180604'] !== undefined, { timeout: 10000 });

    const targetSlug = 'E00180604';
    
    // 4. Pan to and open popup programmatically
    await page.evaluate((slug) => {
        let center = null;
        window.leafletMap.eachLayer(l => {
            if (l.feature && l.feature.properties.slug === slug) {
                center = l.getBounds().getCenter();
                l.openPopup();
            }
        });
        if (center) window.leafletMap.panTo(center);
    }, targetSlug);
    
    // 5. Click Claim
    await page.evaluate(() => {
        const btn = document.querySelector('.claim button');
        if (btn) btn.click();
    });
    
    // Wait for color change to purple
    await page.waitForFunction((slug) => window.meshblockColors[slug] === '#9d5fa7', targetSlug, { timeout: 10000 });

    // 6. Open popup again and check visibility
    await page.evaluate((slug) => {
        let center = null;
        window.leafletMap.eachLayer(l => {
            if (l.feature && l.feature.properties.slug === slug) {
                center = l.getBounds().getCenter();
                l.openPopup();
            }
        });
        if (center) window.leafletMap.panTo(center);
    }, targetSlug);
    
    await page.waitForSelector('.mark-complete-toggle button', { state: 'visible', timeout: 10000 });
    const btn = page.locator('.mark-complete-toggle button');
    await expect(btn).toBeVisible({ timeout: 10000 });

    // 7. Check non-owner visibility
    // Claim as someone else via SQL
    execSync('docker exec neighbourly-test-db psql -U postgres -d postgres -c "DELETE FROM claims WHERE mesh_block_slug = \'E00180604\';"');
    execSync('docker exec neighbourly-test-db psql -U postgres -d postgres -c "INSERT INTO claims (mesh_block_slug, campaign_id, mesh_block_claimer, status, claim_date) VALUES (\'E00180604\', 1, \'other@example.com\', \'claimed\', NOW());"');
    
    // Refresh map
    await page.evaluate(() => window.updateLeafletMap(true));
    await page.waitForFunction((slug) => window.meshblockColors[slug] === '#d5545a', targetSlug, { timeout: 10000 });

    // Click it
    await page.evaluate((slug) => {
        let center = null;
        window.leafletMap.eachLayer(l => {
            if (l.feature && l.feature.properties.slug === slug) {
                center = l.getBounds().getCenter();
                l.openPopup();
            }
        });
        if (center) window.leafletMap.panTo(center);
    }, targetSlug);
    
    // Check hidden
    const hiddenBtn = page.locator('.mark-complete-toggle button');
    await expect(hiddenBtn).toBeHidden({ timeout: 10000 });
  });
});
