const { test, expect } = require('@playwright/test');

test.describe('BUG-2604250800 - Claiming as admin sets color to claimed_by_you', () => {
  const port = process.env.APP_PORT || 4567;

  test('Claiming an area as an admin should style it as claimed_by_you, not quarantine/complete', async ({ page }) => {
    await page.goto(`http://localhost:${port}/`);

    // Add logging for browser console
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    // Add logging for bounds requests
    page.on('request', request => {
      console.log('>> Request:', request.method(), request.url());
    });
    page.on('response', async response => {
      console.log('<< Response:', response.status(), response.url());
      if (response.url().includes('meshblocks_bounds')) {
        const body = await response.text();
        console.log('<< Meshblock Body length:', body.length);
        if (body.length < 100) console.log('<< Meshblock Body:', body);
      }
    });

    await page.goto(`http://localhost:${port}/`);
    await page.fill('input[name="email"]', 'admin-bug@example.com');
    await page.click('input[value="Log In"]');
    if (await page.url().includes('user_details')) {
      await page.fill('input[name="user_details[first_name]"]', 'Admin');
      await page.fill('input[name="user_details[last_name]"]', 'User');
      await page.fill('input[name="user_details[phone]"]', '123456');
      await page.fill('input[name="user_details[postcode]"]', 'GU24 9LY');
      await page.click('input[value="Submit"]');
    }
    await page.waitForURL(`http://localhost:${port}/map`);

    // Create a campaign
    await page.goto(`http://localhost:${port}/admin/campaigns`);
    const uniqueName = `Color Test Campaign ${Date.now()}`;
    await page.fill('input[name="name"]', uniqueName);
    const cedSelect = page.locator('select[name="ced_ids[]"]');
    await cedSelect.selectOption({ label: 'Lightwater, West End and Bisley ED (Surrey)' });
    await page.click('button:has-text("Create Campaign")');

    // Go to map
    await page.goto(`http://localhost:${port}/map`);
    
    // Manually set view to Bisley to ensure we are in the right place
    await page.evaluate(() => {
      if (window.leafletMap) {
        window.leafletMap.setView([51.33282, -0.644385], 15);
      }
    });

    await page.locator('#campaign').selectOption({ label: uniqueName });

    // Wait for the map to load the feature layer
    console.log('Waiting for map features...');
    for (let i = 0; i < 30; i++) {
      const stats = await page.evaluate(() => {
        if (!window.leafletMap) return { total: 0, features: 0, types: [] };
        const layers = Object.values(window.leafletMap._layers);
        const featureLayers = layers.filter(l => l.feature || (l.getLayers && l.getLayers().some(sub => sub.feature)));
        const types = layers.map(l => l.constructor.name);
        return { 
          total: layers.length, 
          features: featureLayers.length,
          types: types.slice(0, 5),
          hasFeature: layers.some(l => l.feature !== undefined)
        };
      });
      console.log(`Attempt ${i}: Total: ${stats.total}, Features: ${stats.features}, HasFeature: ${stats.hasFeature}, Types: ${stats.types.join(',')}`);
      if (stats.features > 0) break;
      await page.waitForTimeout(1000);
    }

    // Find the first polygon on the map
    const layerId = await page.evaluate(() => {
      const layers = window.leafletMap._layers;
      const poly = Object.values(layers).find(l => l.feature && l.feature.properties && l.feature.properties.claim_status !== 'claimed_by_you');
      if (poly) return poly._leaflet_id;
      return null;
    });

    expect(layerId).not.toBeNull();

    // Check is_admin from DOM
    const isAdmin = await page.evaluate(() => {
      const mapDiv = document.getElementById('map');
      return mapDiv ? mapDiv.getAttribute('data-is-admin') : 'MAP NOT FOUND';
    });
    console.log('Is Admin from DOM:', isAdmin);

    // Now open the popup and then click "Claim"
    await page.evaluate((id) => {
      const layer = window.leafletMap._layers[id];
      console.log('Opening popup for layer:', id, layer.feature.properties.slug);
      layer.openPopup();
    }, layerId);
 
    // Debug popup DOM
    for (let i = 0; i < 10; i++) {
      const popupHtml = await page.evaluate(() => {
        const popup = document.querySelector('.leaflet-popup-content');
        if (!popup) return 'POPUP NOT FOUND';
        return popup.innerHTML;
      });
      console.log(`Popup HTML (Attempt ${i}):`, popupHtml.substring(0, 200));
      if (popupHtml.includes('popupgrp claim')) break;
      await page.waitForTimeout(500);
    }

    // Wait for popup to show claim button
    await page.waitForSelector('.popupgrp.claim:not(.hidden) button');
    
    // Click claim
    await page.evaluate(() => {
      const btn = document.querySelector('.popupgrp.claim:not(.hidden) button');
      if (btn) btn.click();
      else console.error('CLAIM BUTTON NOT FOUND IN EVALUATE');
    });

    // We can evaluate the style color directly on the layer now
    // Wait a bit for the setStyle to apply
    let fillColor = '';
    for (let i = 0; i < 10; i++) {
      fillColor = await page.evaluate((slug) => {
        const layers = window.leafletMap._layers;
        const allSlugs = Object.values(layers)
          .map(l => l.feature && l.feature.properties ? l.feature.properties.slug : null)
          .filter(s => s !== null);
        
        const matching = Object.values(layers).filter(l => l.feature && l.feature.properties && l.feature.properties.slug === slug);
        
        let foundColor = null;
        matching.forEach(l => {
          const opts = l.options || l._options;
          if (opts && opts.fillColor) foundColor = opts.fillColor;
          
          // Check children if it's a group
          if (l._layers) {
            Object.values(l._layers).forEach(child => {
              const copts = child.options || child._options;
              if (copts && copts.fillColor) foundColor = copts.fillColor;
            });
          }
        });
        
        if (foundColor) return foundColor;
        
        return 'POLYGON NOT FOUND (Matches: ' + matching.length + ', All Slugs: ' + allSlugs.slice(0, 10).join(',') + ')';
      }, layerId); // layerId is the slug
      console.log(`Fill Color (Attempt ${i}):`, fillColor);
      if (fillColor === '#9d5fa7') break;
      await page.waitForTimeout(1000);
    }
 
    // The color should be '#9d5fa7' (claimed_by_you), NOT '#2171b5' (quarantine/complete)
    expect(fillColor).toBe('#9d5fa7');
  });
});
