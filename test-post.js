const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { userId: 6, tenantId: 2, rankLevel: 2, departmentId: 1 },
  'replace-with-a-very-secure-random-256-bit-key-for-production'
);

const payload = JSON.stringify({
  title: "API Subtask Test",
  description: "Testing API",
  dueDate: "2026-06-20",
  priority: "High",
  departmentId: null,
  assigneeIds: [6],
  subtasks: ["Subtask 1", "Subtask 2"]
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/tasks',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'Authorization': 'Bearer ' + token
  }
}, (res) => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => console.log("Response:", data));
});

req.write(payload);
req.end();
