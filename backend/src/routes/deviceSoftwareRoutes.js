import express from 'express';
import {
  assignSoftware,
  getDeviceSoftware,
} from '../controllers/deviceSoftwareController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { assignSoftwareSchema, deviceIdParamSchema } from '../validation/schemas.js';

const router = express.Router();

// Assign a software item to a device.
router.post('/', validateBody(assignSoftwareSchema), assignSoftware);

// Read software assignments for one device.
router.get('/:deviceId', validateParams(deviceIdParamSchema), getDeviceSoftware);

export default router;