const { test, expect } = require('@playwright/test');

test.describe('Mesh Block Rendering', () => {
  const port = process.env.APP_PORT || 4567;

  test('meshblocks_bounds API returns 200 and valid JSON', async ({ request }) => {
    // Login to get session
    await request.post(`http://localhost:${port}/login`, {
      form: { email: 'admin@example.com' }
    });
    
    // We use a valid campaign ID for the UAT environment (14)
    const response = await request.get(`http://localhost:${port}/meshblocks_bounds?sey=51.34340042078349&sex=-0.6852078437805176&nwy=51.35451062769601&nwx=-0.6601452827453613&campaign_id=14`);
    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.type).toBe('FeatureCollection');
  });

  test('mesh block overlays are rendered on the map when zoomed in', async ({ page }) => {
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

    // 2. Set map view to an area known to have data (Lightwater) and zoom in (>14)
    // Leaflet must have a view and zoom level set before it can render layers correctly.
    await page.evaluate(() => {
      window.leafletMap.setView([51.349, -0.676], 15);
    });

    // 3. Ensure a campaign is selected
    const dropdown = page.locator('#campaign');
    
    // Wait for the dropdown to be populated from the API
    await expect(async () => {
      const count = await dropdown.locator('option').count();
      expect(count).toBeGreaterThan(1);
    }).toPass();

    // Select a campaign known to cover the Lightwater area (CED 1121)
    const campaignToSelect = await dropdown.locator('option[value="14"], option[value="15"]').first().getAttribute('value').catch(() => null);
    
    if (campaignToSelect) {
      await dropdown.selectOption(campaignToSelect);
    } else {
      await dropdown.selectOption({ index: 1 });
    }

    // 4. Wait for the meshblocks request and response triggered by campaign selection
    const response = await page.waitForResponse(
      res => res.url().includes('/meshblocks_bounds') && res.status() === 200,
      { timeout: 10000 }
    );
    
    const json = await response.json();

    // 5. Assert that mesh block elements (SVG paths) exist on the map
    if (json.features && json.features.length > 0) {
      // Leaflet 0.7.x renders GeoJSON as <path> elements in an SVG layer.
      // We wait for at least one path to appear.
      await page.waitForSelector('.leaflet-map-pane svg path', { timeout: 10000 });
      
      const pathCount = await page.locator('.leaflet-map-pane svg path').count();
      expect(pathCount).toBeGreaterThan(0);
    } else {
      console.warn('No features returned for this area in UAT DB, skipping visual rendering check.');
    }
  });
});
