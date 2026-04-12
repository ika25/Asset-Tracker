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
  const { name, ip_address, type, x_position, y_position, floor_id, icon } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO devices (name, ip_address, type, x_position, y_position, floor_id, icon)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, ip_address, type, x_position, y_position, floor_id, icon]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update device (partial update supported)
export const updateDevice = async (req, res) => {
  const { id } = req.params;

  // Extract fields from request
  const {
    name,
    ip_address,
    type,
    status,
    x_position,
    y_position,
    icon,
  } = req.body;

  try {
    // Use COALESCE to keep existing values if not provided
    const result = await pool.query(
      `UPDATE devices SET
        name = COALESCE($1, name),
        ip_address = COALESCE($2, ip_address),
        type = COALESCE($3, type),
        status = COALESCE($4, status),
        x_position = COALESCE($5, x_position),
        y_position = COALESCE($6, y_position),
        icon = COALESCE($7, icon)
      WHERE id = $8
      RETURNING *`,
      [name, ip_address, type, status, x_position, y_position, icon, id]
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