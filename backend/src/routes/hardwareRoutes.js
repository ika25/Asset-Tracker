import express from 'express';

import {
  getHardware,
  createHardware,
  updateHardware,
  deleteHardware,
  bulkDeleteHardware,
} from '../controllers/hardwareController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { hardwareCreateSchema, hardwareUpdateSchema, idParamSchema, bulkDeleteSchema } from '../validation/schemas.js';

const router = express.Router();

// Hardware list endpoint.
router.get('/', getHardware);

// Create requires body validation before controller logic runs.
router.post('/', validateBody(hardwareCreateSchema), createHardware);

// Bulk delete
router.post('/bulk-delete', validateBody(bulkDeleteSchema), bulkDeleteHardware);

// Update validates both route id and request body.
router.put('/:id', validateParams(idParamSchema), validateBody(hardwareUpdateSchema), updateHardware);

// Delete only needs a valid id param.
router.delete('/:id', validateParams(idParamSchema), deleteHardware);

export default router;