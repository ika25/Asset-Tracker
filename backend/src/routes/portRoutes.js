import express from 'express';
import {
  createDevicePort,
  deletePort,
  disconnectPort,
  getDeviceNetworkMap,
  getDevicePorts,
  getPortConnection,
  updatePort,
  upsertPortConnection,
} from '../controllers/portController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import {
  deviceIdParamSchema,
  idParamSchema,
  portConnectionCreateSchema,
  switchPortCreateSchema,
  switchPortUpdateSchema,
} from '../validation/schemas.js';

const router = express.Router();

router.get('/devices/:deviceId/ports', validateParams(deviceIdParamSchema), getDevicePorts);
router.post('/devices/:deviceId/ports', validateParams(deviceIdParamSchema), validateBody(switchPortCreateSchema), createDevicePort);
router.get('/devices/:deviceId/network-map', validateParams(deviceIdParamSchema), getDeviceNetworkMap);

router.put('/ports/:id', validateParams(idParamSchema), validateBody(switchPortUpdateSchema), updatePort);
router.delete('/ports/:id', validateParams(idParamSchema), deletePort);
router.get('/ports/:id/connection', validateParams(idParamSchema), getPortConnection);
router.post('/ports/:id/connection', validateParams(idParamSchema), validateBody(portConnectionCreateSchema), upsertPortConnection);
router.delete('/ports/:id/connection', validateParams(idParamSchema), disconnectPort);

export default router;