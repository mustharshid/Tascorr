const http = require('http');

async function test() {
  // 1. Login
  const loginData = JSON.stringify({ email: 'ceo@tascorr.com', password: 'password123' }); // Try standard seed credentials
  
  const loginReq = http.request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length }
  }, (res) => {
    const cookie = res.headers['set-cookie'] ? res.headers['set-cookie'][0].split(';')[0] : '';
    
    // 2. Fetch Tasks
    const taskReq = http.request({
      hostname: 'localhost', port: 3000, path: '/api/tasks/1', method: 'GET',
      headers: { 'Cookie': cookie }
    }, (taskRes) => {
      let data = '';
      taskRes.on('data', c => data += c);
      taskRes.on('end', () => console.log("Task 1:", data.substring(0, 500) + "..."));
    });
    taskReq.end();
  });
  loginReq.write(loginData);
  loginReq.end();
}
test();
