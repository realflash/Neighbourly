const express = require('express');
const handler = require('./handler');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Helper to simulate the AWS Lambda callback
const lambdaCallback = (res) => (err, response) => {
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

app.get('/territories/bounds', (req, res) => {
  console.log('Received request for /territories/bounds', req.query);
  const event = {
    queryStringParameters: req.query
  };
  handler.getForBounds(event, {}, lambdaCallback(res));
});

app.get('/map', (req, res) => {
  const event = {
    queryStringParameters: req.query
  };
  handler.generateMap(event, {}, lambdaCallback(res));
});

app.listen(port, () => {
  console.log(`Bounds Service listening on port ${port}`);
});
