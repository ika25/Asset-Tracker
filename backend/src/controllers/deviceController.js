import pool from '../config/db.js';
import {
  actorNameFromRequest,
  buildMetadata,
  diffFields,
  insertAuditLog,
} from '../utils/audit.js';

const DEVICE_SELECT = `
  SELECT
    d.id,
    d.name,
    d.ip_address,
    d.type,
    d.status,
    d.x_position,
    d.y_position,
    d.floor_id,
    d.icon,
    dd.os,
    dd.ram,
    dd.disk_space,
    dd.device_age,
    dd.serial_number,
    dd.warranty_expiry,
    dd.location
  FROM devices d
  LEFT JOIN device_details dd ON dd.device_id = d.id
`;

const normalizeValue = (value) => (value === '' || value === undefined ? null : value);

const insertStatusHistory = async (client, { deviceId, previousStatus, newStatus, actorName, metadata }) => {
  await client.query(
    `INSERT INTO device_status_history (device_id, previous_status, new_status, actor_name, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [deviceId, previousStatus, newStatus, actorName, metadata]
  );
};

const getDeviceById = async (client, id) => {
  const { rows } = await client.query(`${DEVICE_SELECT} WHERE d.id = $1`, [id]);
  return rows[0] || null;
};

export const getDevices = async (req, res) => {
  try {
    const result = await pool.query(`${DEVICE_SELECT} ORDER BY d.id DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createDevice = async (req, res) => {
  const {
    name,
    ip_address,
    type,
    status,
    x_position,
    y_position,
    floor_id,
    icon,
    os,
    ram,
    disk_space,
    device_age,
    serial_number,
    warranty_expiry,
    location,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const deviceResult = await client.query(
      `INSERT INTO devices (name, ip_address, type, status, x_position, y_position, floor_id, icon)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        normalizeValue(name),
        normalizeValue(ip_address),
        normalizeValue(type),
        normalizeValue(status) || 'Active',
        normalizeValue(x_position),
        normalizeValue(y_position),
        normalizeValue(floor_id),
        normalizeValue(icon) || '💻',
      ]
    );

    const deviceId = deviceResult.rows[0].id;

    await client.query(
      `INSERT INTO device_details (device_id, os, ram, disk_space, device_age, serial_number, warranty_expiry, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (device_id) DO UPDATE SET
         os = EXCLUDED.os,
         ram = EXCLUDED.ram,
         disk_space = EXCLUDED.disk_space,
         device_age = EXCLUDED.device_age,
         serial_number = EXCLUDED.serial_number,
         warranty_expiry = EXCLUDED.warranty_expiry,
         location = EXCLUDED.location,
         updated_at = NOW()`,
      [
        deviceId,
        normalizeValue(os),
        normalizeValue(ram),
        normalizeValue(disk_space),
        normalizeValue(device_age),
        normalizeValue(serial_number),
        normalizeValue(warranty_expiry),
        normalizeValue(location),
      ]
    );

    const createdDevice = await getDeviceById(client, deviceId);
    const metadata = buildMetadata(req);
    const actorName = actorNameFromRequest(req);

    await insertAuditLog(client, {
      entityType: 'device',
      entityId: deviceId,
      action: 'created',
      actorName,
      changes: { after: createdDevice },
      metadata,
    });

    if (createdDevice?.status) {
      await insertStatusHistory(client, {
        deviceId,
        previousStatus: null,
        newStatus: createdDevice.status,
        actorName,
        metadata,
      });
    }

    await client.query('COMMIT');
    res.json(createdDevice);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const updateDevice = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await getDeviceById(client, id);
    if (!existing) {
      await client.query('ROLLBACK');
      res.status(404).json({ error: 'Device not found' });
      return;
    }

    const nextDevice = {
      name: Object.prototype.hasOwnProperty.call(req.body, 'name') ? normalizeValue(req.body.name) : existing.name,
      ip_address: Object.prototype.hasOwnProperty.call(req.body, 'ip_address') ? normalizeValue(req.body.ip_address) : existing.ip_address,
      type: Object.prototype.hasOwnProperty.call(req.body, 'type') ? normalizeValue(req.body.type) : existing.type,
      status: Object.prototype.hasOwnProperty.call(req.body, 'status') ? normalizeValue(req.body.status) : existing.status,
      x_position: Object.prototype.hasOwnProperty.call(req.body, 'x_position') ? normalizeValue(req.body.x_position) : existing.x_position,
      y_position: Object.prototype.hasOwnProperty.call(req.body, 'y_position') ? normalizeValue(req.body.y_position) : existing.y_position,
      floor_id: Object.prototype.hasOwnProperty.call(req.body, 'floor_id') ? normalizeValue(req.body.floor_id) : existing.floor_id,
      icon: Object.prototype.hasOwnProperty.call(req.body, 'icon') ? normalizeValue(req.body.icon) : existing.icon,
      os: Object.prototype.hasOwnProperty.call(req.body, 'os') ? normalizeValue(req.body.os) : existing.os,
      ram: Object.prototype.hasOwnProperty.call(req.body, 'ram') ? normalizeValue(req.body.ram) : existing.ram,
      disk_space: Object.prototype.hasOwnProperty.call(req.body, 'disk_space') ? normalizeValue(req.body.disk_space) : existing.disk_space,
      device_age: Object.prototype.hasOwnProperty.call(req.body, 'device_age') ? normalizeValue(req.body.device_age) : existing.device_age,
      serial_number: Object.prototype.hasOwnProperty.call(req.body, 'serial_number') ? normalizeValue(req.body.serial_number) : existing.serial_number,
      warranty_expiry: Object.prototype.hasOwnProperty.call(req.body, 'warranty_expiry') ? normalizeValue(req.body.warranty_expiry) : existing.warranty_expiry,
      location: Object.prototype.hasOwnProperty.call(req.body, 'location') ? normalizeValue(req.body.location) : existing.location,
    };

    await client.query(
      `UPDATE devices SET
        name = $1,
        ip_address = $2,
        type = $3,
        status = $4,
        x_position = $5,
        y_position = $6,
        floor_id = $7,
        icon = $8
       WHERE id = $9`,
      [
        nextDevice.name,
        nextDevice.ip_address,
        nextDevice.type,
        nextDevice.status,
        nextDevice.x_position,
        nextDevice.y_position,
        nextDevice.floor_id,
        nextDevice.icon,
        id,
      ]
    );

    await client.query(
      `INSERT INTO device_details (device_id, os, ram, disk_space, device_age, serial_number, warranty_expiry, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (device_id) DO UPDATE SET
         os = EXCLUDED.os,
         ram = EXCLUDED.ram,
         disk_space = EXCLUDED.disk_space,
         device_age = EXCLUDED.device_age,
         serial_number = EXCLUDED.serial_number,
         warranty_expiry = EXCLUDED.warranty_expiry,
         location = EXCLUDED.location,
         updated_at = NOW()`,
      [
        id,
        nextDevice.os,
        nextDevice.ram,
        nextDevice.disk_space,
        nextDevice.device_age,
        nextDevice.serial_number,
        nextDevice.warranty_expiry,
        nextDevice.location,
      ]
    );

    const updatedDevice = await getDeviceById(client, id);
    const changes = diffFields(existing, updatedDevice);
    const metadata = buildMetadata(req);
    const actorName = actorNameFromRequest(req);

    if (Object.keys(changes).length > 0) {
      await insertAuditLog(client, {
        entityType: 'device',
        entityId: Number(id),
        action: changes.x_position || changes.y_position ? 'moved_or_updated' : 'updated',
        actorName,
        changes,
        metadata,
      });
    }

    if (existing.status !== updatedDevice.status && updatedDevice.status) {
      await insertStatusHistory(client, {
        deviceId: Number(id),
        previousStatus: existing.status,
        newStatus: updatedDevice.status,
        actorName,
        metadata,
      });
    }

    await client.query('COMMIT');
    res.json(updatedDevice);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const deleteDevice = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existing = await getDeviceById(client, id);

    await client.query('DELETE FROM devices WHERE id = $1', [id]);

    if (existing) {
      await insertAuditLog(client, {
        entityType: 'device',
        entityId: Number(id),
        action: 'deleted',
        actorName: actorNameFromRequest(req),
        changes: { before: existing },
        metadata: buildMetadata(req),
      });
    }

    await client.query('COMMIT');
    res.json({ message: 'Device deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};