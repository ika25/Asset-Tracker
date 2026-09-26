import pool from '../config/db.js';
import {
  actorNameFromRequest,
  buildMetadata,
  diffFields,
  insertAuditLog,
} from '../utils/audit.js';
import { HttpError } from '../errors/httpError.js';
import { parseCSV, generateCSV, validateRows } from '../utils/csv.js';
import { softwareCSVImportSchema } from '../validation/schemas.js';

// Convert optional empty fields to NULL before writing to Postgres.
const normalize = (v) => (v === '' || v === undefined ? null : v);

const getSoftwareById = async (client, id) => {
  const { rows } = await client.query('SELECT * FROM software WHERE id = $1', [id]);
  return rows[0] || null;
};

export const getSoftware = async (req, res, next) => {
  try {
    // Keep a stable order so list pagination/filtering behaves predictably.
    const result = await pool.query('SELECT * FROM software ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

export const createSoftware = async (req, res, next) => {
  const { name, version, vendor, license_type, license_expiry, installed_on, installation_date } = req.body;
  const client = await pool.connect();
  try {
    // Insert + audit are one unit so we never have data without history (or vice versa).
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO software (name, version, vendor, license_type, license_expiry, installed_on, installation_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [normalize(name), normalize(version), normalize(vendor), normalize(license_type),
       normalize(license_expiry), normalize(installed_on), normalize(installation_date)]
    );

    await insertAuditLog(client, {
      entityType: 'software',
      entityId: result.rows[0].id,
      action: 'created',
      actorName: actorNameFromRequest(req),
      changes: { after: result.rows[0] },
      metadata: buildMetadata(req),
    });

    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

export const updateSoftware = async (req, res, next) => {
  const { id } = req.params;
  const { name, version, vendor, license_type, license_expiry, installed_on, installation_date } = req.body;
  const client = await pool.connect();
  try {
    // Run update and audit together so the audit trail always describes real DB state.
    await client.query('BEGIN');

    const existing = await getSoftwareById(client, id);
    if (!existing) {
      await client.query('ROLLBACK');
      next(new HttpError(404, 'Software not found'));
      return;
    }

    const result = await client.query(
      `UPDATE software SET name=$1, version=$2, vendor=$3, license_type=$4,
       license_expiry=$5, installed_on=$6, installation_date=$7 WHERE id=$8 RETURNING *`,
      [normalize(name), normalize(version), normalize(vendor), normalize(license_type),
       normalize(license_expiry), normalize(installed_on), normalize(installation_date), id]
    );

    const changes = diffFields(existing, result.rows[0]);
    // Skip no-op audit events when payload does not actually change any fields.
    if (Object.keys(changes).length > 0) {
      await insertAuditLog(client, {
        entityType: 'software',
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

export const deleteSoftware = async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    // Grab "before" state so the delete audit entry is still meaningful after row removal.
    await client.query('BEGIN');
    const existing = await getSoftwareById(client, id);
    await client.query('DELETE FROM software WHERE id=$1', [id]);

    if (existing) {
      await insertAuditLog(client, {
        entityType: 'software',
        entityId: Number(id),
        action: 'deleted',
        actorName: actorNameFromRequest(req),
        changes: { before: existing },
        metadata: buildMetadata(req),
      });
    }

    await client.query('COMMIT');
    res.json({ message: 'Deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

export const bulkDeleteSoftware = async (req, res, next) => {
  const { ids } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const softwareIds = ids.map((id) => Number(id));

    // Fetch existing software for audit
    const existingResult = await client.query(
      'SELECT * FROM software WHERE id = ANY($1::int[])',
      [softwareIds]
    );
    const existingSoftware = existingResult.rows;

    if (existingSoftware.length === 0) {
      await client.query('ROLLBACK');
      next(new HttpError(404, 'No software found with the provided IDs.'));
      return;
    }

    // Delete software
    await client.query('DELETE FROM software WHERE id = ANY($1::int[])', [softwareIds]);

    // Audit each deletion
    const metadata = buildMetadata(req);
    const actorName = actorNameFromRequest(req);

    for (const software of existingSoftware) {
      await insertAuditLog(client, {
        entityType: 'software',
        entityId: Number(software.id),
        action: 'deleted',
        actorName,
        changes: { before: software },
        metadata,
      });
    }

    await client.query('COMMIT');
    res.json({
      message: `Successfully deleted ${existingSoftware.length} software item(s).`,
      count: existingSoftware.length,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

export const importSoftwareFromCSV = async (req, res, next) => {
  try {
    if (!req.file) {
      next(new HttpError(400, 'No file provided.'));
      return;
    }

    // Parse CSV
    const rows = parseCSV(req.file.buffer, [
      'name',
      'version',
      'vendor',
      'license_type',
      'license_expiry',
      'installation_date',
    ]);

    // Validate rows
    const { valid: validRows, invalid: invalidRows } = validateRows(rows, softwareCSVImportSchema);

    if (validRows.length === 0) {
      next(new HttpError(400, `No valid rows to import. ${invalidRows.length} row(s) with errors.`));
      return;
    }

    // Insert valid rows
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const importedSoftware = [];
      const metadata = buildMetadata(req);
      const actorName = actorNameFromRequest(req);

      for (const row of validRows) {
        // Insert software
        const result = await client.query(
          `INSERT INTO software (name, version, vendor, license_type, license_expiry, installation_date)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            normalize(row.name),
            normalize(row.version),
            normalize(row.vendor),
            normalize(row.license_type),
            row.license_expiry || null,
            row.installation_date || null,
          ]
        );

        const softwareId = result.rows[0].id;

        // Audit log
        await insertAuditLog(client, {
          entityType: 'software',
          entityId: softwareId,
          action: 'created',
          actorName,
          changes: { after: row },
          metadata,
        });

        importedSoftware.push({ id: softwareId, ...row });
      }

      await client.query('COMMIT');

      res.json({
        message: `CSV import completed. ${importedSoftware.length} software item(s) imported successfully.`,
        imported: importedSoftware.length,
        skipped: validRows.length - importedSoftware.length,
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

export const exportSoftwareToCSV = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM software ORDER BY id ASC');
    const software = result.rows;

    // Select columns to export
    const columns = ['id', 'name', 'version', 'vendor', 'license_type', 'license_expiry', 'installation_date'];

    const csv = generateCSV(software, columns);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="software.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
