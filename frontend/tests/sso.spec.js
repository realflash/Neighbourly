const { test, expect } = require('@playwright/test');

test.describe('SSO Authentication', () => {
  test('user is automatically logged in via proxy headers', async ({ page, request }) => {
    const port = process.env.APP_PORT || 4567;
    const proxySecret = 'test_proxy_secret';
    const testEmail = 'sso-user@example.com';

    const adminEmail = 'admin@example.com';

    // 1. Create the user first by logging in normally once
    await page.goto(`http://localhost:${port}/`);
    await page.fill('input[name="email"]', adminEmail);
    await page.click('input[value="Log In"]');
    if (await page.url().includes('user_details')) {
      await page.fill('input[name="user_details[first_name]"]', 'Admin');
      await page.fill('input[name="user_details[last_name]"]', 'User');
      await page.fill('input[name="user_details[phone]"]', '123456');
      await page.fill('input[name="user_details[postcode]"]', '1234');
      await page.click('input[value="Submit"]');
    }
    await page.waitForURL(`http://localhost:${port}/map`);
    
    // Clear cookies to simulate fresh session but user now exists in DB
    await page.context().clearCookies();

    // 2. Access the map page with proxy headers
    await page.setExtraHTTPHeaders({
      'X-Forwarded-Email': adminEmail,
      'X-Proxy-Secret': proxySecret
    });

    // We need the server to have the PROXY_SECRET set to 'test_proxy_secret'
    // This test assumes the server is started with this ENV var.
    
    await page.goto(`http://localhost:${port}/map`);
    
    // 3. Verify we are on the map page and not redirected to login
    await expect(page.url()).toContain('/map');
    await expect(page.locator('.welcome-message')).toContainText('Admin');
  });

  test('user is NOT logged in if proxy secret is incorrect', async ({ page }) => {
    const port = process.env.APP_PORT || 4567;
    
    await page.setExtraHTTPHeaders({
      'X-Forwarded-Email': 'admin@example.com',
      'X-Proxy-Secret': 'WRONG_SECRET'
    });

    await page.goto(`http://localhost:${port}/map`);
    
    // Should be redirected to root/login
    await expect(page.url()).not.toContain('/map');
  });
});
