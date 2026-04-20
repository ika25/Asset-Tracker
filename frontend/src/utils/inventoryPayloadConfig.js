const HARDWARE_PAYLOAD_FIELDS = [
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

const SOFTWARE_PAYLOAD_FIELDS = [
  'name',
  'version',
  'vendor',
  'license_type',
  'license_expiry',
  'installed_on',
  'installation_date',
];

const normalizeOptionalValue = (value) => {
  return value === null || value === undefined ? '' : value;
};

const buildPayload = (source, fields) => {
  return fields.reduce((payload, field) => {
    payload[field] = normalizeOptionalValue(source[field]);
    return payload;
  }, {});
};

export const sanitizeHardwarePayload = (hardware = {}) => {
  return buildPayload(hardware, HARDWARE_PAYLOAD_FIELDS);
};

export const sanitizeSoftwarePayload = (software = {}) => {
  return buildPayload(software, SOFTWARE_PAYLOAD_FIELDS);
};