// test-api.js
import http from 'http';

const data = JSON.stringify({ productId: 1, quantity: 1, size: 'S' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/home-visit-cart',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
    // I don't have a valid JWT token, so it will fail with 401 Unauthorized!
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
