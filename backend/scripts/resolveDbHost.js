import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import net from 'net';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);
const ENV_FILE = path.join(process.cwd(), '.env');

const parseEnv = (content) => {
  const parsed = {};
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    parsed[key] = value;
  });
  return parsed;
};

const canConnect = (host, port, timeoutMs = 1800) => {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    let settled = false;

    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.setTimeout(timeoutMs);
    socket.on('connect', () => finish(true));
    socket.on('timeout', () => finish(false));
    socket.on('error', () => finish(false));
  });
};

const getWslIp = async () => {
  const { stdout } = await execFileAsync('wsl.exe', ['--', 'ip', '-o', '-4', 'addr', 'show', 'eth0']);
  const match = stdout.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
};

const updateDbHost = async (nextHost) => {
  const content = await fs.readFile(ENV_FILE, 'utf8');
  const lineEnding = content.includes('\r\n') ? '\r\n' : '\n';
  let updated = content;

  if (/^DB_HOST=.*$/m.test(updated)) {
    updated = updated.replace(/^DB_HOST=.*$/m, `DB_HOST=${nextHost}`);
  } else {
    const suffix = updated.endsWith(lineEnding) || updated.length === 0 ? '' : lineEnding;
    updated = `${updated}${suffix}DB_HOST=${nextHost}${lineEnding}`;
  }

  if (updated !== content) {
    await fs.writeFile(ENV_FILE, updated, 'utf8');
  }
};

const run = async () => {
  try {
    const envContent = await fs.readFile(ENV_FILE, 'utf8');
    const envVars = parseEnv(envContent);
    const autoDetect = (envVars.DB_HOST_AUTO_WSL || 'true').toLowerCase() === 'true';

    if (!autoDetect) {
      console.log('[db-host] Auto-detect disabled via DB_HOST_AUTO_WSL=false.');
      return;
    }

    const port = Number(envVars.DB_PORT || '5432');
    const currentHost = envVars.DB_HOST || 'localhost';

    if (await canConnect(currentHost, port)) {
      console.log(`[db-host] Using configured DB_HOST=${currentHost}.`);
      return;
    }

    if (process.platform !== 'win32') {
      console.log('[db-host] Current DB_HOST unreachable and WSL auto-detect is only needed on Windows.');
      return;
    }

    const wslIp = await getWslIp();
    if (!wslIp) {
      console.log('[db-host] Could not detect WSL IP. Keeping current DB_HOST.');
      return;
    }

    if (!(await canConnect(wslIp, port))) {
      console.log(`[db-host] WSL IP ${wslIp}:${port} is not reachable. Keeping current DB_HOST.`);
      return;
    }

    await updateDbHost(wslIp);
    console.log(`[db-host] Updated DB_HOST to reachable WSL IP ${wslIp}.`);
  } catch (error) {
    console.log(`[db-host] Host resolution skipped: ${error.message}`);
  }
};

run();
