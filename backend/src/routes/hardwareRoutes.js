import express from 'express';

import {
  getHardware,
  createHardware,
  updateHardware,
  deleteHardware,
} from '../controllers/hardwareController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { hardwareCreateSchema, hardwareUpdateSchema, idParamSchema } from '../validation/schemas.js';

const router = express.Router();

// Hardware list endpoint.
router.get('/', getHardware);

// Create requires body validation before controller logic runs.
router.post('/', validateBody(hardwareCreateSchema), createHardware);

// Update validates both route id and request body.
router.put('/:id', validateParams(idParamSchema), validateBody(hardwareUpdateSchema), updateHardware);

// Delete only needs a valid id param.
router.delete('/:id', validateParams(idParamSchema), deleteHardware);

export default router;