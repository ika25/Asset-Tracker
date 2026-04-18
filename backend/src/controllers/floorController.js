import pool from '../config/db.js';
import { HttpError } from '../errors/httpError.js';

export const getFloors = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM floors');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const createFloor = async (req, res, next) => {
  const { name, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO floors (name, description) VALUES ($1, $2) RETURNING *`,
      [name, description]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const updateFloor = async (req, res, next) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    const result = await pool.query(
      `UPDATE floors SET name=$1, description=$2 WHERE id=$3 RETURNING *`,
      [name, description, id]
    );

    if (!result.rows[0]) {
      next(new HttpError(404, 'Floor not found'));
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

export const deleteFloor = async (req, res, next) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM floors WHERE id=$1', [id]);
    res.json({ message: 'Floor deleted' });
  } catch (err) {
    next(err);
  }
};
