import { spawn } from 'child_process';
import { HttpError } from '../errors/httpError.js';

const DEFAULT_SCAN_TARGET = '192.168.1.0/24';
const IPV4_SEGMENT = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const IPV4_REGEX = new RegExp(`^${IPV4_SEGMENT}(\\.${IPV4_SEGMENT}){3}$`);
const IPV4_CIDR_REGEX = new RegExp(`^${IPV4_SEGMENT}(\\.${IPV4_SEGMENT}){3}\\/(3[0-2]|[12]?\\d)$`);

const parseNmapReportTarget = (value) => {
  const trimmed = String(value || '').trim();
  const match = trimmed.match(/^(.*)\((\d{1,3}(?:\.\d{1,3}){3})\)$/);

  if (match) {
    const hostname = match[1].trim();
    return {
      ipAddress: match[2],
      hostname: hostname || null,
    };
  }

  const ipMatch = trimmed.match(/\d{1,3}(?:\.\d{1,3}){3}/);
  if (!ipMatch) {
    return { ipAddress: null, hostname: trimmed || null };
  }

  const ipAddress = ipMatch[0];
  return {
    ipAddress,
    hostname: trimmed === ipAddress ? null : trimmed,
  };
};

const parseScanOutput = (stdout) => {
  const devices = [];
  const lines = String(stdout || '').split(/\r?\n/);
  let current = null;

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('Nmap scan report for ')) {
      if (current?.ipAddress) {
        devices.push(current);
      }

      const targetInfo = trimmed.replace('Nmap scan report for ', '');
      const { ipAddress, hostname } = parseNmapReportTarget(targetInfo);

      current = {
        ipAddress,
        hostname,
        macAddress: null,
        vendor: null,
        status: 'up',
      };

      return;
    }

    if (current && trimmed.startsWith('MAC Address:')) {
      const macMatch = trimmed.match(/^MAC Address:\s+([0-9A-F:]+)(?:\s+\((.+)\))?/i);
      if (macMatch) {
        current.macAddress = macMatch[1] || null;
        current.vendor = macMatch[2] || null;
      }
    }
  });

  if (current?.ipAddress) {
    devices.push(current);
  }

  return devices;
};

export const scanNetwork = (target = DEFAULT_SCAN_TARGET) => {
  const normalizedTarget = String(target || '').trim() || DEFAULT_SCAN_TARGET;

  if (!IPV4_REGEX.test(normalizedTarget) && !IPV4_CIDR_REGEX.test(normalizedTarget)) {
    throw new HttpError(400, 'Invalid scan target. Use IPv4 or CIDR notation (example: 192.168.1.0/24).');
  }

  return new Promise((resolve, reject) => {
    const scan = spawn('nmap', ['-sn', normalizedTarget], {
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    scan.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    scan.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    scan.on('error', (error) => {
      if (error.code === 'ENOENT') {
        reject(new HttpError(500, 'Network scan tool not found. Install nmap on the backend host to use scanning.'));
        return;
      }

      reject(error);
    });

    scan.on('close', (code) => {
      if (code !== 0) {
        reject(new HttpError(500, (stderr || `Network scan failed with exit code ${code}.`).trim()));
        return;
      }

      resolve({
        target: normalizedTarget,
        devices: parseScanOutput(stdout),
      });
    });
  });
};