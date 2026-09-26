// This controller handles hardware CRUD and writes matching audit events.
import pool from '../config/db.js';
import {
  actorNameFromRequest,
  buildMetadata,
  diffFields,
  insertAuditLog,
} from '../utils/audit.js';
import { HttpError } from '../errors/httpError.js';
import { parseCSV, generateCSV, validateRows } from '../utils/csv.js';
import { hardwareCSVImportSchema } from '../validation/schemas.js';

// UI forms submit empty strings for optional fields; DB should store those as NULL.
const normalize = (v) => (v === '' || v === undefined ? null : v);

const getHardwareById = async (client, id) => {
  const { rows } = await client.query('SELECT * FROM hardware WHERE id = $1', [id]);
  return rows[0] || null;
};

// Return newest hardware first so recently added assets are easiest to find.
export const getHardware = async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT * FROM hardware ORDER BY id DESC`);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const createHardware = async (req, res, next) => {
  const { name, type, manufacturer, model, purchase_date, cost, warranty_expiry, status, location } = req.body;
  const client = await pool.connect();

  try {
    // Create the row and write audit together. If either fails, rollback keeps history trustworthy.
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
    next(err);
  } finally {
    client.release();
  }
};

export const updateHardware = async (req, res, next) => {
  const { id } = req.params;
  const { name, type, manufacturer, model, purchase_date, cost, warranty_expiry, status, location } = req.body;
  const client = await pool.connect();

  try {
    // Update + audit share one transaction so the log always reflects what actually persisted.
    await client.query('BEGIN');

    const existing = await getHardwareById(client, id);
    if (!existing) {
      await client.query('ROLLBACK');
      next(new HttpError(404, 'Hardware not found'));
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
    // If nothing changed, skip creating an "updated" audit entry to avoid noisy history.
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
    next(err);
  } finally {
    client.release();
  }
};

export const deleteHardware = async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    // Delete and audit should either both happen or both rollback.
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
    next(err);
  } finally {
    client.release();
  }
};

export const bulkDeleteHardware = async (req, res, next) => {
  const { ids } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const hardwareIds = ids.map((id) => Number(id));

    // Fetch existing hardware for audit
    const existingResult = await client.query(
      'SELECT * FROM hardware WHERE id = ANY($1::int[])',
      [hardwareIds]
    );
    const existingHardware = existingResult.rows;

    if (existingHardware.length === 0) {
      await client.query('ROLLBACK');
      next(new HttpError(404, 'No hardware found with the provided IDs.'));
      return;
    }

    // Delete hardware
    await client.query('DELETE FROM hardware WHERE id = ANY($1::int[])', [hardwareIds]);

    // Audit each deletion
    const metadata = buildMetadata(req);
    const actorName = actorNameFromRequest(req);

    for (const hardware of existingHardware) {
      await insertAuditLog(client, {
        entityType: 'hardware',
        entityId: Number(hardware.id),
        action: 'deleted',
        actorName,
        changes: { before: hardware },
        metadata,
      });
    }

    await client.query('COMMIT');
    res.json({
      message: `Successfully deleted ${existingHardware.length} hardware item(s).`,
      count: existingHardware.length,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

export const importHardwareFromCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      next(new HttpError(400, 'No file provided.'));
      return;
    }

    // Parse CSV
    const rows = parseCSV(req.file.buffer, [
      'name',
      'type',
      'model',
      'manufacturer',
      'purchase_date',
      'cost',
      'location',
      'warranty_expiry',
      'status',
    ]);

    // Validate rows
    const { valid: validRows, invalid: invalidRows } = validateRows(rows, hardwareCSVImportSchema);

    if (validRows.length === 0) {
      next(new HttpError(400, `No valid rows to import. ${invalidRows.length} row(s) with errors.`));
      return;
    }

    // Helper function to normalize values
    const normalize = (v) => (v === '' || v === undefined ? null : v);

    // Insert valid rows
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const importedHardware = [];
      const metadata = buildMetadata(req);
      const actorName = actorNameFromRequest(req);

      for (const row of validRows) {
        // Insert hardware
        const result = await client.query(
          `INSERT INTO hardware (name, type, model, manufacturer, purchase_date, cost, location, warranty_expiry, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            normalize(row.name),
            normalize(row.type),
            normalize(row.model),
            normalize(row.manufacturer),
            row.purchase_date || null,
            normalize(row.cost),
            normalize(row.location),
            row.warranty_expiry || null,
            normalize(row.status),
          ]
        );

        const hardwareId = result.rows[0].id;

        // Audit log
        await insertAuditLog(client, {
          entityType: 'hardware',
          entityId: hardwareId,
          action: 'created',
          actorName,
          changes: { after: row },
          metadata,
        });

        importedHardware.push({ id: hardwareId, ...row });
      }

      await client.query('COMMIT');

      res.json({
        message: `CSV import completed. ${importedHardware.length} hardware item(s) imported successfully.`,
        imported: importedHardware.length,
        skipped: validRows.length - importedHardware.length,
        invalidRows: invalidRows.length,
        errors: invalidRows,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
};

export const exportHardwareToCSV = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM hardware ORDER BY id ASC');
    const hardware = result.rows;

    // Select columns to export
    const columns = [
      'id',
      'name',
      'type',
      'model',
      'manufacturer',
      'purchase_date',
      'cost',
      'location',
      'warranty_expiry',
      'status',
    ];

    const csv = generateCSV(hardware, columns);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="hardware.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};