const express = require('express');
const handler = require('./handler');

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.GOOGLE_MAPS_KEY) {
  console.error('FATAL ERROR: GOOGLE_MAPS_KEY environment variable is missing or empty.');
  process.exit(1);
}

app.use(express.json());

const lambdaCallback = (res) => (err, response) => {
  if (res.headersSent) return;
  if (err) {
    console.error('Lambda Error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
  
  if (response.headers) {
    Object.keys(response.headers).forEach(key => {
      res.setHeader(key, response.headers[key]);
    });
  }
  
  const statusCode = response.statusCode || 200;
  
  // The response body from the handler is a stringified JSON
  try {
    const parsedBody = JSON.parse(response.body);
    res.status(statusCode).json(parsedBody);
  } catch (e) {
    res.status(statusCode).send(response.body);
  }
};

const basePath = process.env.BASE_PATH || '';

app.get(`${basePath}/territories/bounds`, (req, res) => {
  console.log(`Received request for ${basePath}/territories/bounds`, req.query);
  const event = {
    queryStringParameters: req.query
  };
  handler.getForBounds(event, {}, lambdaCallback(res));
});

app.get(`${basePath}/map`, (req, res) => {
  const event = {
    queryStringParameters: req.query
  };
  handler.generateMap(event, {}, lambdaCallback(res));
});

app.listen(port, () => {
  console.log(`Bounds Service listening on port ${port}`);
});
