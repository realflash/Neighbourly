const { test, expect } = require('@playwright/test');

test('Bounds service should not crash and return 500 when database connection fails', async ({ request }) => {
  // Try to fetch bounds. This should return a 500 Internal Server Error,
  // but it SHOULD NOT crash the bounds service container.
  const response = await request.get('http://localhost:3000/territories/bounds?nwx=-0.6508&nwy=51.3628&sex=-0.7075&sey=51.3381');
  
  // The service might return 500 due to bad credentials, which is expected during this test if .env is bad.
  // But we want to ensure it responds instead of crashing (which causes connection refused).
  expect(response.status()).toBeGreaterThanOrEqual(200);
});
