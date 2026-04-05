import { spawn } from 'node:child_process';

const processes = [
  { name: 'web', color: '\x1b[32m', args: ['run', 'dev:web'] },
  { name: 'admin', color: '\x1b[33m', args: ['run', 'dev:admin'] },
  { name: 'api', color: '\x1b[34m', args: ['run', 'dev:api'] },
];

const reset = '\x1b[0m';
const children = [];
let isShuttingDown = false;

function normalizeCwd(value) {
  if (!value) {
    return process.cwd();
  }

  if (value.startsWith('\\\\?\\')) {
    return value.slice(4);
  }

  return value;
}

function prefixAndWrite(stream, prefix, data) {
  const text = data.toString();
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    if (!line) {
      continue;
    }

    stream.write(`${prefix}${line}${reset}\n`);
  }
}

function shutdown(signal = 'SIGTERM') {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const processInfo of processes) {
  const prefix = `${processInfo.color}[${processInfo.name}] `;
  const child = spawn(process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe', ['/d', '/s', '/c', 'npm', ...processInfo.args], {
    cwd: normalizeCwd(process.cwd()),
    env: process.env,
    shell: false,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  children.push(child);

  child.stdout.on('data', (data) => prefixAndWrite(process.stdout, prefix, data));
  child.stderr.on('data', (data) => prefixAndWrite(process.stderr, prefix, data));

  child.on('exit', (code, signal) => {
    if (!isShuttingDown && code && code !== 0) {
      process.stderr.write(`${prefix}Thoat voi ma loi ${code}.${reset}\n`);
      shutdown();
      process.exitCode = code;
      return;
    }

    if (!isShuttingDown && signal) {
      process.stderr.write(`${prefix}Dung boi tin hieu ${signal}.${reset}\n`);
      shutdown();
    }
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
