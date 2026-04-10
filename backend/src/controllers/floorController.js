import pool from '../config/db.js';

export const getFloors = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM floors');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createFloor = async (req, res) => {
  const { name, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO floors (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateFloor = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const result = await pool.query(
      `UPDATE floors SET name=$1, description=$2 WHERE id=$3 RETURNING *`,
      [name, description, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFloor = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM floors WHERE id=$1', [id]);
    res.json({ message: 'Floor deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
