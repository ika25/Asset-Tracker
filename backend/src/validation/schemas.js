import { z } from 'zod';

const optionalString = z.union([z.string(), z.literal('')]).optional();
const dateString = z.union([
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD date.'),
  z.literal(''),
]).optional();
const idParam = z.object({ id: z.coerce.number().int().positive() });
const deviceIdParam = z.object({ deviceId: z.coerce.number().int().positive() });
const numberLike = z.union([z.number(), z.string(), z.null()]).optional();
const statusValue = z.enum(['Active', 'Inactive', 'Retired', 'In Repair', 'For Sale', 'Online', 'Offline']).optional();

export const deviceCreateSchema = z.object({
  name: optionalString,
  ip_address: optionalString,
  type: optionalString,
  status: statusValue,
  x_position: numberLike,
  y_position: numberLike,
  floor_id: numberLike,
  icon: optionalString,
  manufacturer: optionalString,
  os: optionalString,
  user_name: optionalString,
  ram: optionalString,
  disk_space: optionalString,
  device_age: optionalString,
  serial_number: optionalString,
  install_date: dateString,
  location: optionalString,
}).strict();

export const deviceUpdateSchema = deviceCreateSchema.partial();

export const hardwareCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  type: z.string().trim().min(1, 'Type is required.'),
  model: optionalString,
  manufacturer: optionalString,
  purchase_date: dateString,
  cost: optionalString,
  location: optionalString,
  warranty_expiry: dateString,
  status: statusValue,
}).strict();

export const hardwareUpdateSchema = hardwareCreateSchema;

export const softwareCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  version: optionalString,
  vendor: z.string().trim().min(1, 'Vendor is required.'),
  license_type: optionalString,
  license_expiry: dateString,
  installed_on: optionalString,
  installation_date: dateString,
}).strict();

export const softwareUpdateSchema = softwareCreateSchema;

export const floorCreateSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  description: optionalString,
}).strict();

export const floorUpdateSchema = floorCreateSchema;

export const assignSoftwareSchema = z.object({
  device_id: z.coerce.number().int().positive(),
  software_id: z.coerce.number().int().positive(),
}).strict();

export const idParamSchema = idParam;
export const deviceIdParamSchema = deviceIdParam;