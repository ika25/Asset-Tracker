import pool from '../config/db.js';

const normalize = (v) => (v === '' || v === undefined ? null : v);

export const getSoftware = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM software ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSoftware = async (req, res) => {
  const { name, version, vendor, license_type, license_expiry, installed_on, installation_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO software (name, version, vendor, license_type, license_expiry, installed_on, installation_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [normalize(name), normalize(version), normalize(vendor), normalize(license_type),
       normalize(license_expiry), normalize(installed_on), normalize(installation_date)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSoftware = async (req, res) => {
  const { id } = req.params;
  const { name, version, vendor, license_type, license_expiry, installed_on, installation_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE software SET name=$1, version=$2, vendor=$3, license_type=$4,
       license_expiry=$5, installed_on=$6, installation_date=$7 WHERE id=$8 RETURNING *`,
      [normalize(name), normalize(version), normalize(vendor), normalize(license_type),
       normalize(license_expiry), normalize(installed_on), normalize(installation_date), id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteSoftware = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM software WHERE id=$1', [id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
