import { scanNetwork } from '../services/nmapService.js';

export const runScan = async (req, res) => {
  try {
    const result = await scanNetwork();
    res.json({ output: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};