import express from 'express';
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  bulkDeleteDevices,
} from '../controllers/deviceController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { deviceCreateSchema, deviceUpdateSchema, idParamSchema, bulkDeleteSchema } from '../validation/schemas.js';

const router = express.Router();

router.get('/', getDevices);
router.post('/', validateBody(deviceCreateSchema), createDevice);
router.post('/bulk-delete', validateBody(bulkDeleteSchema), bulkDeleteDevices);
router.put('/:id', validateParams(idParamSchema), validateBody(deviceUpdateSchema), updateDevice);
router.delete('/:id', validateParams(idParamSchema), deleteDevice);

export default router;