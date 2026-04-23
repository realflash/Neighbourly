const { test, expect } = require('@playwright/test');

test.describe('Campaign Admin and Filtering', () => {
  test('admin can create and archive a campaign', async ({ page }) => {
    // 0. Login as admin
    await page.goto('http://localhost:4567/');
    await page.fill('input[name="email"]', 'admin@example.com');
    await page.click('input[value="Log In"]');
    // If user didn't exist, we might need to fill details.
    // Let's assume it goes to user_details page if new.
    if (await page.url().includes('user_details')) {
      await page.fill('input[name="user_details[first_name]"]', 'Admin');
      await page.fill('input[name="user_details[last_name]"]', 'User');
      await page.fill('input[name="user_details[phone]"]', '123456');
      await page.fill('input[name="user_details[postcode]"]', '1234');
      await page.click('input[value="Submit"]');
    }
    
    // Wait for map redirect
    await page.waitForURL('http://localhost:4567/map');
    // 1. Create campaign
    await page.goto('http://localhost:4567/admin/campaigns');
    await expect(page.locator('h1')).toContainText('Campaign Administration');

    const uniqueName = `Test Campaign ${Date.now()}`;
    await page.fill('input[name="name"]', uniqueName);
    // Select first ward
    const wardSelect = page.locator('select[name="ward_ids[]"]');
    await wardSelect.selectOption({ index: 1 });
    
    await page.click('button:has-text("Create Campaign")');

    // 2. Verify creation
    await expect(page.locator('.alert-success')).toContainText('Campaign created successfully.');
    await expect(page.locator('h3', { hasText: uniqueName }).first()).toBeVisible();

    // 3. Archive campaign
    const archiveButton = page.locator('.campaign-card', { hasText: uniqueName }).locator('button:has-text("Archive Campaign")');
    
    // Accept the confirm dialog
    page.on('dialog', dialog => dialog.accept());
    await archiveButton.click();

    // 4. Verify archived
    await expect(page.locator('.alert-success')).toContainText('Campaign archived.');
  });
});
