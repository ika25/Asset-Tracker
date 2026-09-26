import express from 'express';
import multer from 'multer';

import {
  getHardware,
  createHardware,
  updateHardware,
  deleteHardware,
  bulkDeleteHardware,
  importHardwareFromCSV,
  exportHardwareToCSV,
} from '../controllers/hardwareController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { hardwareCreateSchema, hardwareUpdateSchema, idParamSchema, bulkDeleteSchema } from '../validation/schemas.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Hardware list endpoint.
router.get('/', getHardware);

// Create requires body validation before controller logic runs.
router.post('/', validateBody(hardwareCreateSchema), createHardware);

// Bulk delete
router.post('/bulk-delete', validateBody(bulkDeleteSchema), bulkDeleteHardware);

// CSV import/export
router.post('/import/csv', upload.single('file'), importHardwareFromCSV);
router.get('/export/csv', exportHardwareToCSV);

// Update validates both route id and request body.
router.put('/:id', validateParams(idParamSchema), validateBody(hardwareUpdateSchema), updateHardware);

// Delete only needs a valid id param.
router.delete('/:id', validateParams(idParamSchema), deleteHardware);

export default router;