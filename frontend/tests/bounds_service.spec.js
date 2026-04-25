const { test, expect } = require('@playwright/test');

test('Bounds service should not crash and return 500 when database connection fails', async ({ request }) => {
  // Try to fetch bounds. This should return a 200 OK because DB credentials are correct.
  const response = await request.get('http://localhost:3000/ground-bounds/territories/bounds?nwx=-0.6508&nwy=51.3628&sex=-0.7075&sey=51.3381');
  
  // The service must return 200 OK
  expect(response.status()).toBe(200);
});
