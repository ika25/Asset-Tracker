import express from 'express';
import {
  assignSoftware,
  getDeviceSoftware,
} from '../controllers/deviceSoftwareController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { assignSoftwareSchema, deviceIdParamSchema } from '../validation/schemas.js';

const router = express.Router();

// Assign software
router.post('/', validateBody(assignSoftwareSchema), assignSoftware);

// Get software for device
router.get('/:deviceId', validateParams(deviceIdParamSchema), getDeviceSoftware);

export default router;