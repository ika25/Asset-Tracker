ALTER TABLE IF EXISTS devices
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS floor_id INTEGER,
  ADD COLUMN IF NOT EXISTS icon VARCHAR(32) DEFAULT '💻';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'floors'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'devices'
        AND constraint_name = 'devices_floor_id_fkey'
    ) THEN
      ALTER TABLE devices
        ADD CONSTRAINT devices_floor_id_fkey
        FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS device_details (
  device_id INTEGER PRIMARY KEY REFERENCES devices(id) ON DELETE CASCADE,
  os VARCHAR(255),
  ram VARCHAR(255),
  disk_space VARCHAR(255),
  device_age VARCHAR(255),
  serial_number VARCHAR(255),
  warranty_expiry DATE,
  location VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'devices' AND column_name = 'os'
  ) THEN
    INSERT INTO device_details (
      device_id,
      os,
      ram,
      disk_space,
      device_age,
      serial_number,
      warranty_expiry,
      location
    )
    SELECT
      d.id,
      d.os,
      d.ram,
      d.disk_space,
      d.device_age,
      d.serial_number,
      d.warranty_expiry,
      d.location
    FROM devices d
    ON CONFLICT (device_id) DO UPDATE SET
      os = EXCLUDED.os,
      ram = EXCLUDED.ram,
      disk_space = EXCLUDED.disk_space,
      device_age = EXCLUDED.device_age,
      serial_number = EXCLUDED.serial_number,
      warranty_expiry = EXCLUDED.warranty_expiry,
      location = EXCLUDED.location,
      updated_at = NOW();
  END IF;
END $$;

ALTER TABLE IF EXISTS devices DROP COLUMN IF EXISTS os;
ALTER TABLE IF EXISTS devices DROP COLUMN IF EXISTS ram;
ALTER TABLE IF EXISTS devices DROP COLUMN IF EXISTS disk_space;
ALTER TABLE IF EXISTS devices DROP COLUMN IF EXISTS device_age;
ALTER TABLE IF EXISTS devices DROP COLUMN IF EXISTS serial_number;
ALTER TABLE IF EXISTS devices DROP COLUMN IF EXISTS warranty_expiry;
ALTER TABLE IF EXISTS devices DROP COLUMN IF EXISTS location;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'device_software'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'device_software'
        AND constraint_name = 'device_software_device_id_fkey'
    ) THEN
      ALTER TABLE device_software
        ADD CONSTRAINT device_software_device_id_fkey
        FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'device_software'
        AND constraint_name = 'device_software_software_id_fkey'
    ) THEN
      ALTER TABLE device_software
        ADD CONSTRAINT device_software_software_id_fkey
        FOREIGN KEY (software_id) REFERENCES software(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_software_unique ON device_software (device_id, software_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices (status);
CREATE INDEX IF NOT EXISTS idx_devices_type ON devices (type);
CREATE INDEX IF NOT EXISTS idx_devices_floor_id ON devices (floor_id);
CREATE INDEX IF NOT EXISTS idx_devices_ip_address ON devices (ip_address);
CREATE INDEX IF NOT EXISTS idx_device_details_warranty_expiry ON device_details (warranty_expiry);
CREATE INDEX IF NOT EXISTS idx_hardware_warranty_expiry ON hardware (warranty_expiry);
CREATE INDEX IF NOT EXISTS idx_software_license_expiry ON software (license_expiry);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_name VARCHAR(255),
  changes JSONB,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS device_status_history (
  id SERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  previous_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_name VARCHAR(255),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_device_status_history_device_id ON device_status_history (device_id, changed_at DESC);