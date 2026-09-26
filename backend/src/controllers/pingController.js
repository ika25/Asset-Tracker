import pool from '../config/db.js';
import { pingHost, pingHosts } from '../services/pingService.js';
import { HttpError } from '../errors/httpError.js';

/**
 * GET /api/ping/:id  — ping a single device by its DB id
 */
export const pingDevice = async (req, res, next) => {
  try {
    const deviceId = Number(req.params.id);
    if (!Number.isInteger(deviceId) || deviceId <= 0) {
      next(new HttpError(400, 'Invalid device ID.'));
      return;
    }

    const result = await pool.query(
      'SELECT id, name, ip_address FROM devices WHERE id = $1',
      [deviceId]
    );
    const device = result.rows[0];

    if (!device) {
      next(new HttpError(404, 'Device not found.'));
      return;
    }

    if (!device.ip_address) {
      res.json({
        deviceId,
        name: device.name,
        ip: null,
        alive: false,
        latency: null,
        checkedAt: new Date().toISOString(),
        message: 'Device has no IP address assigned.',
      });
      return;
    }

    const pingResult = await pingHost(device.ip_address);

    res.json({
      deviceId,
      name: device.name,
      ip: device.ip_address,
      alive: pingResult.alive,
      latency: pingResult.latency,
      checkedAt: pingResult.checkedAt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/ping/batch  — ping all devices that have an IP address
 * Body: { ids?: number[] }  — optional list to limit which device IDs to check
 */
export const pingAllDevices = async (req, res, next) => {
  try {
    const { ids } = req.body || {};

    let query = 'SELECT id, name, ip_address FROM devices WHERE ip_address IS NOT NULL AND ip_address <> \'\'';
    const params = [];

    if (Array.isArray(ids) && ids.length > 0) {
      const deviceIds = ids.map(Number).filter((n) => Number.isInteger(n) && n > 0);
      if (deviceIds.length > 0) {
        params.push(deviceIds);
        query += ` AND id = ANY($1::int[])`;
      }
    }

    const result = await pool.query(query, params);
    const devices = result.rows;

    if (devices.length === 0) {
      res.json({ results: [], checkedAt: new Date().toISOString() });
      return;
    }

    const ips = devices.map((d) => d.ip_address);
    const pingMap = await pingHosts(ips);

    const results = devices.map((device) => {
      const ping = pingMap.get(device.ip_address) || {
        alive: false,
        latency: null,
        checkedAt: new Date().toISOString(),
      };
      return {
        deviceId: device.id,
        name: device.name,
        ip: device.ip_address,
        alive: ping.alive,
        latency: ping.latency,
        checkedAt: ping.checkedAt,
      };
    });

    res.json({
      results,
      total: results.length,
      online: results.filter((r) => r.alive).length,
      offline: results.filter((r) => !r.alive).length,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
};
