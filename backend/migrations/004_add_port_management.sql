CREATE TABLE IF NOT EXISTS switch_ports (
  id SERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  port_number VARCHAR(20) NOT NULL,
  label VARCHAR(255),
  speed VARCHAR(50),
  vlan_id INTEGER,
  port_type VARCHAR(50) NOT NULL DEFAULT 'copper',
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (device_id, port_number)
);

CREATE TABLE IF NOT EXISTS port_connections (
  id SERIAL PRIMARY KEY,
  switch_port_id INTEGER NOT NULL REFERENCES switch_ports(id) ON DELETE CASCADE,
  connected_device_id INTEGER REFERENCES devices(id) ON DELETE SET NULL,
  remote_port_id INTEGER REFERENCES switch_ports(id) ON DELETE SET NULL,
  cable_label VARCHAR(255),
  notes TEXT,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disconnected_at TIMESTAMPTZ,
  CONSTRAINT chk_port_connection_endpoint
    CHECK (connected_device_id IS NOT NULL OR remote_port_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_switch_ports_device_id ON switch_ports (device_id);
CREATE INDEX IF NOT EXISTS idx_port_connections_switch_port_id ON port_connections (switch_port_id);
CREATE INDEX IF NOT EXISTS idx_port_connections_connected_device_id ON port_connections (connected_device_id);
CREATE INDEX IF NOT EXISTS idx_port_connections_remote_port_id ON port_connections (remote_port_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_port_connections_one_active_per_port
  ON port_connections (switch_port_id)
  WHERE disconnected_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_port_connections_one_active_per_remote_port
  ON port_connections (remote_port_id)
  WHERE disconnected_at IS NULL AND remote_port_id IS NOT NULL;
