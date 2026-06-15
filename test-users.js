const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 6, tenantId: 2, rankLevel: 2, departmentId: 1 },
  'replace-with-a-very-secure-random-256-bit-key-for-production'
);

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/users',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log("Response:", JSON.stringify(JSON.parse(data), null, 2)));
});

req.end();
