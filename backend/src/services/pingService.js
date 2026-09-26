import ping from 'ping';

const PING_TIMEOUT_SECONDS = 3;
const BATCH_CONCURRENCY = 20; // max parallel pings at once

/**
 * Ping a single IP address.
 * @param {string} ip - IPv4 address to probe
 * @returns {Promise<{ ip, alive, latency, checkedAt }>}
 */
export const pingHost = async (ip) => {
  const checkedAt = new Date().toISOString();

  try {
    const result = await ping.promise.probe(ip, {
      timeout: PING_TIMEOUT_SECONDS,
      numeric: true,
      // On Windows, use -n; on Linux/Mac, -c is the default handled by the lib
      extra: process.platform === 'win32' ? ['-n', '1'] : ['-c', '1'],
    });

    const latency = result.time === 'unknown' ? null : Number(result.time);

    return {
      ip,
      alive: result.alive,
      latency,
      checkedAt,
    };
  } catch {
    return { ip, alive: false, latency: null, checkedAt };
  }
};

/**
 * Ping multiple IPs concurrently (bounded by BATCH_CONCURRENCY).
 * @param {string[]} ips - Array of IP addresses
 * @returns {Promise<Map<string, { ip, alive, latency, checkedAt }>>} Map keyed by IP
 */
export const pingHosts = async (ips) => {
  const results = new Map();
  const validIps = ips.filter(Boolean);

  // Process in chunks to avoid spawning hundreds of processes at once
  for (let i = 0; i < validIps.length; i += BATCH_CONCURRENCY) {
    const chunk = validIps.slice(i, i + BATCH_CONCURRENCY);
    const chunkResults = await Promise.all(chunk.map(pingHost));
    for (const r of chunkResults) {
      results.set(r.ip, r);
    }
  }

  return results;
};
