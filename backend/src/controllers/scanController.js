import { scanNetwork } from '../services/nmapService.js';

export const runScan = async (req, res, next) => {
  try {
    const result = await scanNetwork();
    res.json({ output: result });
  } catch (err) {
    next(err);
  }
};