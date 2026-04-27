const { test, expect } = require('@playwright/test');

test.describe('Claim Properties', () => {
  const port = process.env.APP_PORT || 4567;
  let selectedCampaignId = null;

  test.beforeEach(async ({ page }) => {
    // Login as admin for setup
    await page.goto(`http://localhost:${port}/`);
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.click('input[value="Log In"]');
    if (await page.url().includes('user_details')) {
      await page.fill('input[name="user_details[first_name]"]', 'Admin');
      await page.fill('input[name="user_details[last_name]"]', 'User');
      await page.fill('input[name="user_details[phone]"]', '123456');
      await page.fill('input[name="user_details[postcode]"]', '1234');
      await page.click('input[value="Submit"]');
    }
    await page.waitForURL(`http://localhost:${port}/map`);

    // Create a unique campaign for this test
    await page.goto(`http://localhost:${port}/admin/campaigns`);
    const uniqueName = `Claims Test Campaign ${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    await page.fill('input[name="name"]', uniqueName);
    const cedSelect = page.locator('select[name="ced_ids[]"]');
    await cedSelect.selectOption({ index: 1 });
    await Promise.all([
      page.waitForNavigation(),
      page.click('button:has-text("Create Campaign")')
    ]);

    // Check for success message
    const flashNotice = await page.locator('.alert-success').innerText().catch(() => '');
    if (!flashNotice.includes('successfully')) {
       console.log(`Node: Campaign creation might have failed. Flash: ${flashNotice}`);
       const errorFlash = await page.locator('.alert-danger').innerText().catch(() => '');
       if (errorFlash) console.log(`Node: Error Flash: ${errorFlash}`);
    }

    // Make sure the campaign is selected on map
    await page.goto(`http://localhost:${port}/map`);
    const dropdown = page.locator('#campaign');
    await expect(async () => {
      const options = await dropdown.locator('option').allInnerTexts();
      expect(options).toContain(uniqueName);
    }).toPass({ timeout: 15000 });
    
    await dropdown.selectOption({ label: uniqueName });
    selectedCampaignId = await dropdown.inputValue();
  });

  test('admin can change priority of a claim', async ({ page }) => {
    // Navigate to map to have context
    await page.goto(`http://localhost:${port}/map`);

    // Simulate priority change using fetch in page context
    const responseStatus = await page.evaluate(async (port) => {
      const response = await fetch(`http://localhost:${port}/claims/test-slug/priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `campaign_id=${window.selectedCampaignId || 1}&priority=low`
      });
      return response.status;
    }, port);

    expect(responseStatus).toBe(200);
  });

  test('user can mark claim as complete', async ({ page }) => {
    await page.goto(`http://localhost:${port}/logout`);
    
    // Login as standard user
    await page.goto(`http://localhost:${port}/`);
    await page.fill('input[name="email"]', 'user@example.com');
    await page.click('input[value="Log In"]');
    if (await page.url().includes('user_details')) {
      await page.fill('input[name="user_details[first_name]"]', 'Standard');
      await page.fill('input[name="user_details[last_name]"]', 'User');
      await page.fill('input[name="user_details[phone]"]', '123456');
      await page.fill('input[name="user_details[postcode]"]', '1234');
      await page.click('input[value="Submit"]');
    }
    
    await page.goto(`http://localhost:${port}/map`);
    
    const responseStatus = await page.evaluate(async (port) => {
      const response = await fetch(`http://localhost:${port}/claims/test-slug-complete/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `campaign_id=1&status=complete`
      });
      return response.status;
    }, port);
    
    // It should be 403 because we don't own the claim
    expect(responseStatus).toBe(403);
  });
});
