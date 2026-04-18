import express from 'express';
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice
} from '../controllers/deviceController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { deviceCreateSchema, deviceUpdateSchema, idParamSchema } from '../validation/schemas.js';

const router = express.Router();

router.get('/', getDevices);
router.post('/', validateBody(deviceCreateSchema), createDevice);
router.put('/:id', validateParams(idParamSchema), validateBody(deviceUpdateSchema), updateDevice);
router.delete('/:id', validateParams(idParamSchema), deleteDevice);

export default router;