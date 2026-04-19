CREATE TABLE IF NOT EXISTS floors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  ip_address VARCHAR(255),
  type VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Active',
  x_position DOUBLE PRECISION,
  y_position DOUBLE PRECISION,
  floor_id INTEGER,
  icon VARCHAR(32) DEFAULT '💻'
);

CREATE TABLE IF NOT EXISTS hardware (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  purchase_date DATE,
  cost VARCHAR(255),
  warranty_expiry DATE,
  status VARCHAR(50) DEFAULT 'Active',
  location VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS software (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  version VARCHAR(255),
  vendor VARCHAR(255) NOT NULL,
  license_type VARCHAR(255),
  license_expiry DATE,
  installed_on VARCHAR(255),
  installation_date DATE
);

CREATE TABLE IF NOT EXISTS device_software (
  id SERIAL PRIMARY KEY,
  device_id INTEGER NOT NULL,
  software_id INTEGER NOT NULL
);