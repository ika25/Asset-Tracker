import express from 'express';
import multer from 'multer';
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice,
  bulkDeleteDevices,
  importDevicesFromCSV,
  exportDevicesToCSV,
} from '../controllers/deviceController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { deviceCreateSchema, deviceUpdateSchema, idParamSchema, bulkDeleteSchema } from '../validation/schemas.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getDevices);
router.post('/', validateBody(deviceCreateSchema), createDevice);
router.post('/bulk-delete', validateBody(bulkDeleteSchema), bulkDeleteDevices);
router.post('/import/csv', upload.single('file'), importDevicesFromCSV);
router.get('/export/csv', exportDevicesToCSV);
router.put('/:id', validateParams(idParamSchema), validateBody(deviceUpdateSchema), updateDevice);
router.delete('/:id', validateParams(idParamSchema), deleteDevice);

export default router;