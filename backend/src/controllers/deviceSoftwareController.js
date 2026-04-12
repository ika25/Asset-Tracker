// Import DB
import pool from '../config/db.js';

// =========================
// Assign software to device
// =========================
export const assignSoftware = async (req, res) => {
  const { device_id, software_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO device_software (device_id, software_id)
       VALUES ($1, $2)
       RETURNING *`,
      [device_id, software_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// =========================
// Get software for device
// =========================
export const getDeviceSoftware = async (req, res) => {
  const { deviceId } = req.params;

  try {
    const result = await pool.query(
      `SELECT s.*
       FROM software s
       JOIN device_software ds ON s.id = ds.software_id
       WHERE ds.device_id = $1`,
      [deviceId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};