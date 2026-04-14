// DB pool
import pool from '../config/db.js';
import {
  actorNameFromRequest,
  buildMetadata,
  diffFields,
  insertAuditLog,
} from '../utils/audit.js';

const normalize = (v) => (v === '' || v === undefined ? null : v);

const getHardwareById = async (client, id) => {
  const { rows } = await client.query('SELECT * FROM hardware WHERE id = $1', [id]);
  return rows[0] || null;
};

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
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO hardware (name, type, manufacturer, model, purchase_date, cost, warranty_expiry, status, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [normalize(name), normalize(type), normalize(manufacturer), normalize(model),
       normalize(purchase_date), normalize(cost), normalize(warranty_expiry),
       status || 'Active', normalize(location)]
    );

    await insertAuditLog(client, {
      entityType: 'hardware',
      entityId: result.rows[0].id,
      action: 'created',
      actorName: actorNameFromRequest(req),
      changes: { after: result.rows[0] },
      metadata: buildMetadata(req),
    });

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('CREATE hardware error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// =========================
// UPDATE hardware
// =========================
export const updateHardware = async (req, res) => {
  const { id } = req.params;
  const { name, type, manufacturer, model, purchase_date, cost, warranty_expiry, status, location } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await getHardwareById(client, id);
    if (!existing) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Hardware not found' });
      return;
    }

    const result = await client.query(
      `UPDATE hardware SET
        name=$1, type=$2, manufacturer=$3, model=$4,
        purchase_date=$5, cost=$6, warranty_expiry=$7, status=$8, location=$9
       WHERE id=$10 RETURNING *`,
      [normalize(name), normalize(type), normalize(manufacturer), normalize(model),
       normalize(purchase_date), normalize(cost), normalize(warranty_expiry),
       status || 'Active', normalize(location), id]
    );

    const changes = diffFields(existing, result.rows[0]);
    if (Object.keys(changes).length > 0) {
      await insertAuditLog(client, {
        entityType: 'hardware',
        entityId: Number(id),
        action: 'updated',
        actorName: actorNameFromRequest(req),
        changes,
        metadata: buildMetadata(req),
      });
    }

    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('UPDATE hardware error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

// =========================
// DELETE hardware
// =========================
export const deleteHardware = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existing = await getHardwareById(client, id);
    await client.query(`DELETE FROM hardware WHERE id = $1`, [id]);

    if (existing) {
      await insertAuditLog(client, {
        entityType: 'hardware',
        entityId: Number(id),
        action: 'deleted',
        actorName: actorNameFromRequest(req),
        changes: { before: existing },
        metadata: buildMetadata(req),
      });
    }

    await client.query('COMMIT');
    res.json({ message: 'Hardware deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('DELETE hardware error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};