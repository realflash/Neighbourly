const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const port = process.env.APP_PORT || 4567;
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('request', req => {
    if (req.url().includes('meshblocks')) {
       console.log('NETWORK REQUEST:', req.url());
    }
  });

  try {
    console.log("Navigating to login...");
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
    console.log("Map loaded. Waiting for 2s...");
    await page.waitForTimeout(2000);
    
    console.log("Zoom level:", await page.evaluate(() => window.leafletMap.getZoom()));
    console.log("Bounds:", await page.evaluate(() => window.leafletMap.getBounds()));
    
    const count = await page.locator('#campaign option').count();
    console.log("Campaign options count:", count);
    
    console.log("Selecting campaign...");
    const val = await page.locator('#campaign option').nth(1).getAttribute('value');
    await page.locator('#campaign').selectOption(val);
    
    console.log("Waiting for 3s...");
    await page.waitForTimeout(3000);
    console.log("Done.");
  } catch (e) {
    console.error(e);
  }
  await browser.close();
})();
