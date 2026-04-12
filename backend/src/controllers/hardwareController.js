// DB pool
import pool from '../config/db.js';

// =========================
// GET all hardware
// =========================
export const getHardware = async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM hardware ORDER BY id DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error('GET hardware error:', err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// CREATE hardware
// =========================
export const createHardware = async (req, res) => {
  const { name, type, manufacturer, model, purchase_date, cost, warranty_expiry, status, location } = req.body;
  const normalize = (v) => (v === '' || v === undefined ? null : v);

  try {
    const result = await pool.query(
      `INSERT INTO hardware (name, type, manufacturer, model, purchase_date, cost, warranty_expiry, status, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [normalize(name), normalize(type), normalize(manufacturer), normalize(model),
       normalize(purchase_date), normalize(cost), normalize(warranty_expiry),
       status || 'Active', normalize(location)]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('CREATE hardware error:', err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// UPDATE hardware
// =========================
export const updateHardware = async (req, res) => {
  const { id } = req.params;
  const { name, type, manufacturer, model, purchase_date, cost, warranty_expiry, status, location } = req.body;
  const normalize = (v) => (v === '' || v === undefined ? null : v);

  try {
    const result = await pool.query(
      `UPDATE hardware SET
        name=$1, type=$2, manufacturer=$3, model=$4,
        purchase_date=$5, cost=$6, warranty_expiry=$7, status=$8, location=$9
       WHERE id=$10 RETURNING *`,
      [normalize(name), normalize(type), normalize(manufacturer), normalize(model),
       normalize(purchase_date), normalize(cost), normalize(warranty_expiry),
       status || 'Active', normalize(location), id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('UPDATE hardware error:', err);
    res.status(500).json({ error: err.message });
  }
};

// =========================
// DELETE hardware
// =========================
export const deleteHardware = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(`DELETE FROM hardware WHERE id = $1`, [id]);
    res.json({ message: 'Hardware deleted' });
  } catch (err) {
    console.error('DELETE hardware error:', err);
    res.status(500).json({ error: err.message });
  }
};