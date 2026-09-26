import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

const normalizeHeaderName = (header = '') => {
  return String(header)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const normalizeStatusValue = (value) => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  const map = {
    active: 'Active',
    inactive: 'Inactive',
    retired: 'Retired',
    'in repair': 'In Repair',
    'for sale': 'For Sale',
    online: 'Online',
    offline: 'Offline',
  };

  return map[trimmed.toLowerCase()] ?? trimmed;
};

const normalizeDateValue = (value) => {
  if (value === null || value === undefined) return '';

  const stringValue = String(value).trim();
  if (!stringValue || /^n\/?a$/i.test(stringValue) || /^unknown$/i.test(stringValue) || stringValue === '-') {
    return '';
  }

  const isoMatch = stringValue.match(/^\d{4}-\d{2}-\d{2}$/);
  if (isoMatch) {
    return stringValue;
  }

  const slashMatch = stringValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const [, month, day, year] = slashMatch;
    const normalizedYear = year.length === 2 ? `20${year}` : year;
    return `${normalizedYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const ageMatch = stringValue.match(/^(\d+)\s*(year|years|yr|yrs|month|months|day|days)$/i);
  if (ageMatch) {
    const [, amountText, unit] = ageMatch;
    const amount = Number(amountText);
    const now = new Date();
    const adjusted = new Date(now);

    if (/year/i.test(unit)) adjusted.setFullYear(now.getFullYear() - amount);
    if (/month/i.test(unit)) adjusted.setMonth(now.getMonth() - amount);
    if (/day/i.test(unit)) adjusted.setDate(now.getDate() - amount);

    return adjusted.toISOString().slice(0, 10);
  }

  return stringValue;
};

const resolveCSVFieldName = (header, expectedHeaders = []) => {
  const normalizedHeader = normalizeHeaderName(header);
  if (!normalizedHeader) return null;

  const exactMatches = expectedHeaders.find((expectedHeader) => normalizeHeaderName(expectedHeader) === normalizedHeader);
  if (exactMatches) {
    return exactMatches;
  }

  const fieldAliases = {
    name: ['name', 'pc_name', 'pc_name_1', 'computer_name', 'device_name'],
    ip_address: ['ip_address', 'ip_address_1', 'ip_address_2', 'ip', 'ip_addresss', 'ip_address_value'],
    type: ['type', 'device_type', 'computer_type'],
    status: ['status', 'state'],
    location: ['location', 'site', 'area', 'department'],
    manufacturer: ['manufacturer', 'make', 'brand'],
    os: ['os', 'operating_system', 'windows_version'],
    user_name: ['user_name', 'username', 'user', 'assigned_user', 'owner', 'assigned_to'],
    ram: ['ram', 'memory', 'memory_size'],
    disk_space: ['disk_space', 'disk', 'storage', 'storage_size', 'hard_drive'],
    serial_number: ['serial_number', 'serial', 'service_tag', 'asset_tag'],
    install_date: ['install_date', 'install_date_1', 'installed_on', 'device_age', 'age', 'purchase_date', 'date_installed'],
  };

  for (const [targetField, aliases] of Object.entries(fieldAliases)) {
    if (aliases.includes(normalizedHeader)) {
      return targetField;
    }
  }

  return null;
};

export const normalizeCSVRows = (rows, expectedHeaders = []) => {
  return rows.map((row) => {
    const normalizedRow = {};

    for (const [key, value] of Object.entries(row)) {
      const targetField = resolveCSVFieldName(key, expectedHeaders);
      if (!targetField) continue;

      let finalValue = value;
      if (targetField === 'install_date') {
        finalValue = normalizeDateValue(value);
      }
      if (targetField === 'status') {
        finalValue = normalizeStatusValue(value);
      }
      if (typeof finalValue === 'string') {
        finalValue = finalValue.trim();
      }

      normalizedRow[targetField] = finalValue ?? '';
    }

    for (const expectedHeader of expectedHeaders) {
      if (!(expectedHeader in normalizedRow)) {
        normalizedRow[expectedHeader] = '';
      }
    }

    return normalizedRow;
  });
};

/**
 * Parse CSV buffer/string and return array of objects
 * @param {Buffer|string} csvData - CSV data to parse
 * @param {string[]} headers - Expected headers (case-insensitive)
 * @returns {Object[]} Array of parsed rows
 */
export const parseCSV = (csvData, headers) => {
  const csvString = Buffer.isBuffer(csvData) ? csvData.toString('utf-8') : csvData;

  const rows = parse(csvString, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  return normalizeCSVRows(rows, headers || []);
};

/**
 * Generate CSV string from array of objects
 * @param {Object[]} data - Array of objects to convert
 * @param {string[]} columns - Column names in order
 * @returns {string} CSV string
 */
export const generateCSV = (data, columns) => {
  return stringify(data, {
    header: true,
    columns,
  });
};

/**
 * Validate CSV rows against a zod schema
 * @param {Object[]} rows - CSV rows parsed
 * @param {Object} schema - Zod schema for validation
 * @returns {Object} { valid: Object[], invalid: Array with { rowIndex, row, error } }
 */
export const validateRows = (rows, schema) => {
  const valid = [];
  const invalid = [];

  rows.forEach((row, index) => {
    try {
      const parsed = schema.parse(row);
      valid.push(parsed);
    } catch (err) {
      invalid.push({
        rowIndex: index + 2, // +2 because headers are row 1, data starts at row 2
        row,
        error: err.errors ? err.errors[0].message : err.message,
      });
    }
  });

  return { valid, invalid };
};
