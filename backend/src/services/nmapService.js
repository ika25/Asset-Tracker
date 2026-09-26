import { spawn } from 'child_process';
import { XMLParser } from 'fast-xml-parser';
import { HttpError } from '../errors/httpError.js';

const DEFAULT_SCAN_TARGET = '192.168.1.0/24';
const IPV4_SEGMENT = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const IPV4_REGEX = new RegExp(`^${IPV4_SEGMENT}(\\.${IPV4_SEGMENT}){3}$`);
const IPV4_CIDR_REGEX = new RegExp(`^${IPV4_SEGMENT}(\\.${IPV4_SEGMENT}){3}\\/(3[0-2]|[12]?\\d)$`);
const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
});

const ensureArray = (value) => {
  if (value === undefined || value === null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
};

const buildPortSummary = (ports) => ports
  .slice(0, 4)
  .map((port) => {
    const serviceName = port.service || 'unknown';
    const productVersion = [port.product, port.version].filter(Boolean).join(' ');
    return productVersion
      ? `${port.port}/${port.protocol} ${serviceName} (${productVersion})`
      : `${port.port}/${port.protocol} ${serviceName}`;
  })
  .join(', ');

const guessDeviceType = ({ hostname, vendor, osGuess, ports }) => {
  const hostnameText = String(hostname || '').toLowerCase();
  const vendorText = String(vendor || '').toLowerCase();
  const osText = String(osGuess || '').toLowerCase();
  const portNumbers = new Set(ports.map((port) => port.port));
  const services = new Set(ports.map((port) => String(port.service || '').toLowerCase()));

  if (
    portNumbers.has(9100) ||
    portNumbers.has(631) ||
    portNumbers.has(515) ||
    services.has('printer') ||
    /(printer|print|hp|brother|epson|canon|xerox|lexmark)/.test(`${hostnameText} ${vendorText}`)
  ) {
    return 'Printer';
  }

  if (
    portNumbers.has(554) ||
    portNumbers.has(8554) ||
    /(camera|cctv|hikvision|dahua|axis)/.test(`${hostnameText} ${vendorText}`)
  ) {
    return 'Camera';
  }

  if (
    /(switch)/.test(`${hostnameText} ${vendorText}`) ||
    (services.has('snmp') && services.has('ssh') && !portNumbers.has(3389))
  ) {
    return 'Switch';
  }

  if (
    /(router|gateway|firewall|ubiquiti|netgear|mikrotik|tp-link|tplink|cisco)/.test(`${hostnameText} ${vendorText}`) ||
    portNumbers.has(161) ||
    services.has('upnp')
  ) {
    return 'Router';
  }

  if (
    /(server)/.test(`${hostnameText} ${osText}`) ||
    portNumbers.has(443) ||
    portNumbers.has(80) ||
    portNumbers.has(22) ||
    portNumbers.has(5432) ||
    portNumbers.has(3306)
  ) {
    return 'Server';
  }

  if (
    /(desktop|workstation|laptop|pc)/.test(`${hostnameText} ${osText}`) ||
    portNumbers.has(3389) ||
    portNumbers.has(445)
  ) {
    return 'PC';
  }

  return 'Other';
};

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

export const parseScanOutput = (stdout) => {
  const xml = xmlParser.parse(String(stdout || ''));
  const hosts = ensureArray(xml?.nmaprun?.host);

  return hosts
    .map((host) => {
      const status = host?.status?.state || 'unknown';
      if (status !== 'up') {
        return null;
      }

      const addresses = ensureArray(host.address);
      const ipv4 = addresses.find((address) => address.addrtype === 'ipv4');
      const mac = addresses.find((address) => address.addrtype === 'mac');

      const hostname = ensureArray(host?.hostnames?.hostname)
        .map((item) => item.name)
        .find(Boolean) || null;

      const osMatches = ensureArray(host?.os?.osmatch)
        .map((match) => ({
          name: match.name || null,
          accuracy: Number(match.accuracy || 0),
        }))
        .filter((match) => match.name)
        .sort((left, right) => right.accuracy - left.accuracy);

      const ports = ensureArray(host?.ports?.port)
        .map((port) => {
          const state = port?.state?.state || 'unknown';
          if (state !== 'open') {
            return null;
          }

          return {
            port: Number(port.portid),
            protocol: port.protocol || 'tcp',
            state,
            service: port?.service?.name || null,
            product: port?.service?.product || null,
            version: port?.service?.version || null,
          };
        })
        .filter(Boolean)
        .sort((left, right) => left.port - right.port);

      const ipAddress = ipv4?.addr || parseNmapReportTarget(host?.hostnames?.hostname?.name || '').ipAddress;
      if (!ipAddress) {
        return null;
      }

      const vendor = mac?.vendor || mac?.vendor?.name || null;
      const osGuess = osMatches[0]?.name || null;

      return {
        ipAddress,
        hostname,
        macAddress: mac?.addr || null,
        vendor,
        status,
        osGuess,
        osAccuracy: osMatches[0]?.accuracy || null,
        deviceTypeGuess: guessDeviceType({ hostname, vendor, osGuess, ports }),
        ports,
        portSummary: buildPortSummary(ports),
      };
    })
    .filter(Boolean);
};

export const scanNetwork = (target = DEFAULT_SCAN_TARGET, options = {}) => {
  const deepScan = options.deepScan === true;
  const normalizedTarget = String(target || '').trim() || DEFAULT_SCAN_TARGET;

  if (!IPV4_REGEX.test(normalizedTarget) && !IPV4_CIDR_REGEX.test(normalizedTarget)) {
    throw new HttpError(400, 'Invalid scan target. Use IPv4 or CIDR notation (example: 192.168.1.0/24).');
  }

  return new Promise((resolve, reject) => {
    const args = deepScan
      ? ['-O', '-sV', '--top-ports', '20', '-T4', '--max-retries', '1', '--host-timeout', '15s', '-oX', '-', normalizedTarget]
      : ['-sn', '-T4', '--max-retries', '1', '--host-timeout', '8s', '-oX', '-', normalizedTarget];

    const scan = spawn('nmap', args, {
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
        mode: deepScan ? 'deep' : 'quick',
        devices: parseScanOutput(stdout),
      });
    });
  });
};