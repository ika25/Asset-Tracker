// Express router
import express from 'express';

// Controller functions
import {
  getHardware,
  createHardware,
  updateHardware,
  deleteHardware,
} from '../controllers/hardwareController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { hardwareCreateSchema, hardwareUpdateSchema, idParamSchema } from '../validation/schemas.js';

const router = express.Router();

// =========================
// Routes
// =========================
router.get('/', getHardware);        // GET all
router.post('/', validateBody(hardwareCreateSchema), createHardware);    // CREATE
router.put('/:id', validateParams(idParamSchema), validateBody(hardwareUpdateSchema), updateHardware);  // UPDATE
router.delete('/:id', validateParams(idParamSchema), deleteHardware); // DELETE

export default router;