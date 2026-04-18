import express from 'express';
import {
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor
} from '../controllers/floorController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { floorCreateSchema, floorUpdateSchema, idParamSchema } from '../validation/schemas.js';

const router = express.Router();

router.get('/', getFloors);
router.post('/', validateBody(floorCreateSchema), createFloor);
router.put('/:id', validateParams(idParamSchema), validateBody(floorUpdateSchema), updateFloor);
router.delete('/:id', validateParams(idParamSchema), deleteFloor);

export default router;
