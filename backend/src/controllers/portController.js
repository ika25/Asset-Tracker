import pool from '../config/db.js';
import { HttpError } from '../errors/httpError.js';

const PORT_SELECT = `
  SELECT
    sp.id,
    sp.device_id,
    sp.port_number,
    sp.label,
    sp.speed,
    sp.vlan_id,
    sp.port_type,
    sp.status,
    sp.created_at,
    sp.updated_at,
    pc.id AS connection_id,
    pc.connected_device_id,
    cd.name AS connected_device_name,
    cd.type AS connected_device_type,
    dd.location AS connected_device_location,
    pc.remote_port_id,
    rsp.port_number AS remote_port_number,
    rsp.device_id AS remote_switch_id,
    rsd.name AS remote_switch_name,
    pc.cable_label,
    pc.notes,
    pc.connected_at,
    pc.disconnected_at
  FROM switch_ports sp
  LEFT JOIN port_connections pc
    ON pc.switch_port_id = sp.id AND pc.disconnected_at IS NULL
  LEFT JOIN devices cd ON cd.id = pc.connected_device_id
  LEFT JOIN device_details dd ON dd.device_id = cd.id
  LEFT JOIN switch_ports rsp ON rsp.id = pc.remote_port_id
  LEFT JOIN devices rsd ON rsd.id = rsp.device_id
`;

const normalizeValue = (value) => (value === '' || value === undefined ? null : value);
const normalizePortType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || 'copper';
};

const isSwitchType = (value) => String(value || '').toLowerCase().includes('switch');

const getDeviceById = async (client, deviceId) => {
  const { rows } = await client.query('SELECT id, name, type FROM devices WHERE id = $1', [deviceId]);
  return rows[0] || null;
};

const getPortById = async (client, portId) => {
  const { rows } = await client.query(`${PORT_SELECT} WHERE sp.id = $1`, [portId]);
  return rows[0] || null;
};

const ensureSwitchDevice = async (client, deviceId) => {
  const device = await getDeviceById(client, deviceId);

  if (!device) {
    throw new HttpError(404, 'Device not found');
  }

  if (!isSwitchType(device.type)) {
    throw new HttpError(400, 'Ports can only be managed for devices with a switch type.');
  }

  return device;
};

const ensurePortExists = async (client, portId) => {
  const port = await getPortById(client, portId);

  if (!port) {
    throw new HttpError(404, 'Port not found');
  }

  return port;
};

const ensureRelatedRecords = async (client, { connectedDeviceId, remotePortId, portId }) => {
  if (connectedDeviceId) {
    const device = await getDeviceById(client, connectedDeviceId);
    if (!device) {
      throw new HttpError(404, 'Connected device not found');
    }
  }

  if (remotePortId) {
    const remotePort = await getPortById(client, remotePortId);
    if (!remotePort) {
      throw new HttpError(404, 'Remote port not found');
    }

    if (Number(remotePort.id) === Number(portId)) {
      throw new HttpError(400, 'A port cannot connect to itself.');
    }
  }
};

const mapPortDbError = (err) => {
  if (err?.code === '23505' && err?.constraint === 'switch_ports_device_id_port_number_key') {
    return new HttpError(409, 'That switch already has a port with this port number. Edit the existing port or use a different port number.');
  }

  return err;
};

export const getDevicePorts = async (req, res, next) => {
  const { deviceId } = req.params;
  const client = await pool.connect();

  try {
    await ensureSwitchDevice(client, deviceId);

    const { rows } = await client.query(
      `${PORT_SELECT} WHERE sp.device_id = $1 ORDER BY sp.port_number ASC, sp.id ASC`,
      [deviceId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

export const createDevicePort = async (req, res, next) => {
  const { deviceId } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await ensureSwitchDevice(client, deviceId);

    const { port_number, label, speed, vlan_id, port_type, status } = req.body;
    const result = await client.query(
      `INSERT INTO switch_ports (device_id, port_number, label, speed, vlan_id, port_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        Number(deviceId),
        port_number.trim(),
        normalizeValue(label),
        normalizeValue(speed),
        normalizeValue(vlan_id),
        normalizePortType(port_type),
        normalizeValue(status) || 'Active',
      ]
    );

    const createdPort = await getPortById(client, result.rows[0].id);
    await client.query('COMMIT');
    res.status(201).json(createdPort);
  } catch (err) {
    await client.query('ROLLBACK');
    next(mapPortDbError(err));
  } finally {
    client.release();
  }
};

export const updatePort = async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const existing = await ensurePortExists(client, id);

    const nextPort = {
      port_number: Object.prototype.hasOwnProperty.call(req.body, 'port_number') ? req.body.port_number.trim() : existing.port_number,
      label: Object.prototype.hasOwnProperty.call(req.body, 'label') ? normalizeValue(req.body.label) : existing.label,
      speed: Object.prototype.hasOwnProperty.call(req.body, 'speed') ? normalizeValue(req.body.speed) : existing.speed,
      vlan_id: Object.prototype.hasOwnProperty.call(req.body, 'vlan_id') ? normalizeValue(req.body.vlan_id) : existing.vlan_id,
      port_type: Object.prototype.hasOwnProperty.call(req.body, 'port_type') ? normalizePortType(req.body.port_type) : existing.port_type,
      status: Object.prototype.hasOwnProperty.call(req.body, 'status') ? normalizeValue(req.body.status) : existing.status,
    };

    await client.query(
      `UPDATE switch_ports
       SET port_number = $1,
           label = $2,
           speed = $3,
           vlan_id = $4,
           port_type = $5,
           status = $6,
           updated_at = NOW()
       WHERE id = $7`,
      [
        nextPort.port_number,
        nextPort.label,
        nextPort.speed,
        nextPort.vlan_id,
        nextPort.port_type,
        nextPort.status,
        Number(id),
      ]
    );

    const updatedPort = await getPortById(client, id);
    await client.query('COMMIT');
    res.json(updatedPort);
  } catch (err) {
    await client.query('ROLLBACK');
    next(mapPortDbError(err));
  } finally {
    client.release();
  }
};

export const deletePort = async (req, res, next) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM switch_ports WHERE id = $1 RETURNING id', [id]);

    if (!result.rowCount) {
      next(new HttpError(404, 'Port not found'));
      return;
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const getPortConnection = async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    const port = await ensurePortExists(client, id);

    if (!port.connection_id) {
      res.json(null);
      return;
    }

    res.json({
      id: port.connection_id,
      switch_port_id: port.id,
      connected_device_id: port.connected_device_id,
      connected_device_name: port.connected_device_name,
      connected_device_type: port.connected_device_type,
      connected_device_location: port.connected_device_location,
      remote_port_id: port.remote_port_id,
      remote_port_number: port.remote_port_number,
      remote_switch_id: port.remote_switch_id,
      remote_switch_name: port.remote_switch_name,
      cable_label: port.cable_label,
      notes: port.notes,
      connected_at: port.connected_at,
      disconnected_at: port.disconnected_at,
    });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};

export const upsertPortConnection = async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await ensurePortExists(client, id);

    const connectedDeviceId = normalizeValue(req.body.connected_device_id);
    const remotePortId = normalizeValue(req.body.remote_port_id);
    await ensureRelatedRecords(client, { connectedDeviceId, remotePortId, portId: id });

    await client.query(
      `UPDATE port_connections
       SET disconnected_at = NOW()
       WHERE switch_port_id = $1 AND disconnected_at IS NULL`,
      [id]
    );

    if (remotePortId) {
      await client.query(
        `UPDATE port_connections
         SET disconnected_at = NOW()
         WHERE remote_port_id = $1 AND disconnected_at IS NULL`,
        [remotePortId]
      );
    }

    await client.query(
      `INSERT INTO port_connections (switch_port_id, connected_device_id, remote_port_id, cable_label, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        Number(id),
        connectedDeviceId,
        remotePortId,
        normalizeValue(req.body.cable_label),
        normalizeValue(req.body.notes),
      ]
    );

    const updatedPort = await getPortById(client, id);
    await client.query('COMMIT');
    res.json(updatedPort);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

export const disconnectPort = async (req, res, next) => {
  const { id } = req.params;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await ensurePortExists(client, id);

    await client.query(
      `UPDATE port_connections
       SET disconnected_at = NOW()
       WHERE switch_port_id = $1 AND disconnected_at IS NULL`,
      [id]
    );

    const updatedPort = await getPortById(client, id);
    await client.query('COMMIT');
    res.json(updatedPort);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

export const getDeviceNetworkMap = async (req, res, next) => {
  const { deviceId } = req.params;
  const client = await pool.connect();

  try {
    const device = await getDeviceById(client, deviceId);
    if (!device) {
      next(new HttpError(404, 'Device not found'));
      return;
    }

    const { rows } = await client.query(
      `${PORT_SELECT}
       WHERE sp.device_id = $1
          OR pc.connected_device_id = $1
          OR rsp.device_id = $1
       ORDER BY sp.device_id ASC, sp.port_number ASC`,
      [deviceId]
    );

    res.json({
      device,
      connections: rows,
    });
  } catch (err) {
    next(err);
  } finally {
    client.release();
  }
};