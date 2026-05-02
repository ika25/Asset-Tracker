import { scanNetwork } from '../services/nmapService.js';

export const runScan = async (req, res, next) => {
  try {
    const target = typeof req.query.target === 'string' ? req.query.target.trim() : undefined;
    const result = await scanNetwork(target);

    res.json({
      target: result.target,
      scannedAt: new Date().toISOString(),
      count: result.devices.length,
      devices: result.devices,
    });
  } catch (err) {
    next(err);
  }
};