const { test, expect } = require('@playwright/test');

test.describe('Campaign Selection', () => {
  const port = process.env.APP_PORT || 4567;

  test('TC-009: Selecting campaign without zooming in updates map', async ({ page }) => {
    // 1. Login
    await page.goto(`http://localhost:${port}/`);
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.click('input[value="Log In"]');
    
    if (await page.url().includes('user_details')) {
      await page.fill('input[name="user_details[first_name]"]', 'Admin');
      await page.fill('input[name="user_details[last_name]"]', 'User');
      await page.fill('input[name="user_details[phone]"]', '123456');
      await page.fill('input[name="user_details[postcode]"]', 'GU18 5TS');
      await page.click('input[value="Submit"]');
    }
    
    await page.waitForURL(`http://localhost:${port}/map`);

    // 2. Do NOT zoom in (default view or postcode view might be zoomed out)
    // Wait for the dropdown to be populated from the API
    const dropdown = page.locator('#campaign');
    await expect(async () => {
      const count = await dropdown.locator('option').count();
      expect(count).toBeGreaterThan(1);
    }).toPass();

    // Wait for the map and dialog to finish animating
    await page.waitForTimeout(2000);

    await page.evaluate(() => {
      if (window.$ && window.$.fn && window.$.fn.dialog && $('#dialog').length) {
          $('#dialog').dialog('close');
      }
    });

    // 3. Select a campaign directly via JS to avoid UI overlapping issues
    await page.evaluate(() => {
      const val = $('#campaign option').eq(1).val();
      $('#campaign').val(val).trigger('change');
    });

    // Wait for Leaflet's zoom animation to complete
    await page.waitForTimeout(500);

    // 4. Assert map zoom was updated to 15
    const zoom = await page.evaluate(() => window.leafletMap.getZoom());
    expect(zoom).toBe(15);
  });
});
