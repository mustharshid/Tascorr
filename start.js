const fs = require('fs');
const path = require('path');

const logPath = path.resolve(__dirname, 'crash.log');

// Log start attempt
fs.writeFileSync(logPath, '--- Launch Attempt: ' + new Date().toISOString() + ' ---\n', { flag: 'a' });

try {
  process.on('uncaughtException', (err) => {
    fs.writeFileSync(logPath, 'Uncaught Exception:\n' + err.stack + '\n', { flag: 'a' });
  });
  
  process.on('unhandledRejection', (reason) => {
    fs.writeFileSync(logPath, 'Unhandled Rejection:\n' + (reason instanceof Error ? reason.stack : reason) + '\n', { flag: 'a' });
  });

  // Load the compiled server
  require('./dist/server/server/index.js');
  fs.writeFileSync(logPath, 'Server index.js successfully loaded.\n', { flag: 'a' });
} catch (err) {
  fs.writeFileSync(logPath, 'Startup Exception Caught:\n' + err.stack + '\n', { flag: 'a' });
  throw err;
}
