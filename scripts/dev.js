const { spawn } = require('child_process');

// ANSI Color Codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log('🏝️ TourVista Development Server Starting...');

const server = spawn('npm', ['run', 'dev', '--prefix', 'server', '--silent'], { shell: true });
const client = spawn('npm', ['start', '--prefix', 'client', '--silent'], { shell: true, env: { ...process.env, BROWSER: 'none' } });

const filterLogs = (data, prefix) => {
  const lines = data.toString().split('\n');
  lines.forEach(line => {
    const cleanLine = line.trim();
    if (!cleanLine) return;

    if (prefix === '[Server]') {
      if (cleanLine.includes('Database connected: Yes')) {
        console.log(`[Server] ${GREEN}${cleanLine}${RESET}`);
      } else if (cleanLine.includes('Database connected: No')) {
        console.log(`[Server] ${RED}${cleanLine}${RESET}`);
      } else if (cleanLine.includes('Server running on port') || cleanLine.includes('Health Check:')) {
        console.log(`[Server] ${cleanLine}`);
      }
    }
    
    if (prefix === '[Client]') {
      if (cleanLine.includes('Local:')) {
        const parts = cleanLine.split('Local:');
        const url = parts[1].trim();
        console.log(`[Client] Browser URL: ${BLUE}${url}${RESET}`);
      } else if (cleanLine.includes('http://localhost:')) {
        console.log(`[Client] Browser URL: ${BLUE}${cleanLine.trim()}${RESET}`);
      } else if (cleanLine.includes('Compiled successfully')) {
        console.log(`[Client] ${GREEN}React App Ready!${RESET}`);
      }
    }
  });
};

server.stdout.on('data', (data) => filterLogs(data, '[Server]'));
server.stderr.on('data', (data) => {
  const log = data.toString();
  if (log.toLowerCase().includes('error')) {
    console.error(`${RED}[Server Error] ${log.trim()}${RESET}`);
  }
});

client.stdout.on('data', (data) => filterLogs(data, '[Client]'));
client.stderr.on('data', (data) => {
  const log = data.toString();
  if (log.toLowerCase().includes('error')) {
    console.error(`${RED}[Client Error] ${log.trim()}${RESET}`);
  }
});

process.on('SIGINT', () => {
    server.kill();
    client.kill();
    process.exit();
});
