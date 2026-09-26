import { scanNetwork } from '../services/nmapService.js';

export const runScan = async (req, res, next) => {
  try {
    const target = typeof req.query.target === 'string' ? req.query.target.trim() : undefined;
    const deepScan = String(req.query.deep || '').toLowerCase() === 'true';
    const result = await scanNetwork(target, { deepScan });

    res.json({
      target: result.target,
      mode: result.mode,
      scannedAt: new Date().toISOString(),
      count: result.devices.length,
      devices: result.devices,
    });
  } catch (err) {
    next(err);
  }
};