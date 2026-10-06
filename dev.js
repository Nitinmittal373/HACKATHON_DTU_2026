/**
 * Shastra — Local Development Runner
 * Starts both backend (port 5000) and frontend (port 3000) concurrently.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('\n=================================================');
console.log('  ॐ  Starting Shastra Full-Stack Local Environment');
console.log('=================================================');
console.log('  Backend:  http://localhost:5000');
console.log('  Frontend: http://localhost:3000');
console.log('=================================================\n');

function prefixStream(stream, prefix) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // preserve incomplete line
    for (const line of lines) {
      if (line.trim().length > 0) {
        console.log(`${prefix} ${line}`);
      }
    }
  });
  stream.on('end', () => {
    if (buffer.trim().length > 0) {
      console.log(`${prefix} ${buffer}`);
    }
  });
}

// 1. Start Backend on port 5000
const backend = spawn(process.execPath, ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  env: { ...process.env, PORT: '5000' }
});
prefixStream(backend.stdout, '[backend]');
prefixStream(backend.stderr, '[backend]');

// 2. Start Frontend on port 3000
const frontend = spawn(process.execPath, ['server.js'], {
  cwd: path.join(__dirname, 'frontend'),
  env: { ...process.env, PORT: '3000' }
});
prefixStream(frontend.stdout, '[frontend]');
prefixStream(frontend.stderr, '[frontend]');

function cleanup() {
  console.log('\nGracefully stopping servers...');
  try {
    if (backend && !backend.killed) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', backend.pid.toString(), '/f', '/t']);
      } else {
        backend.kill('SIGINT');
      }
    }
  } catch (_) {}
  try {
    if (frontend && !frontend.killed) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', frontend.pid.toString(), '/f', '/t']);
      } else {
        frontend.kill('SIGINT');
      }
    }
  } catch (_) {}
  setTimeout(() => process.exit(0), 500);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
