import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';

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

  return rows;
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
