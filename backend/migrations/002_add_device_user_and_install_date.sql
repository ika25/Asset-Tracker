ALTER TABLE IF EXISTS device_details
  ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS install_date DATE;

CREATE INDEX IF NOT EXISTS idx_device_details_install_date ON device_details (install_date);