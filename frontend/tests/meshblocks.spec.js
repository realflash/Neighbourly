const { test, expect } = require('@playwright/test');

test('meshblocks_bounds returns 200 and valid JSON when bounds service is healthy', async ({ request }) => {
  const port = process.env.APP_PORT || 4567;
  
  // Login to get session
  const loginResponse = await request.post(`http://localhost:${port}/login`, {
    form: { email: 'admin@example.com' }
  });
  
  const response = await request.get(`http://localhost:${port}/meshblocks_bounds?sey=51.34340042078349&sex=-0.6852078437805176&nwy=51.35451062769601&nwx=-0.6601452827453613&campaign_id=1`);
  expect(response.status()).toBe(200);
});
