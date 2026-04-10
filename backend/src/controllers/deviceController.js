import pool from '../config/db.js';



export const getDevices = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM devices');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createDevice = async (req, res) => {
  const { name, ip_address, type, x_position, y_position, floor_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO devices (name, ip_address, type, x_position, y_position, floor_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, ip_address, type, x_position, y_position, floor_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDevice = async (req, res) => {
  const { id } = req.params;
  const { name, ip_address, status, x_position, y_position } = req.body;

  try {
    const result = await pool.query(
      `UPDATE devices
       SET name=$1, ip_address=$2, status=$3, x_position=$4, y_position=$5
       WHERE id=$6 RETURNING *`,
      [name, ip_address, status, x_position, y_position, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDevice = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM devices WHERE id=$1', [id]);
    res.json({ message: 'Device deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};