import express from 'express';
import { getSoftware, createSoftware, updateSoftware, deleteSoftware } from '../controllers/softwareController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { idParamSchema, softwareCreateSchema } from '../validation/schemas.js';

const router = express.Router();

router.get('/', getSoftware);
router.post('/', validateBody(softwareCreateSchema), createSoftware);
router.put('/:id', validateParams(idParamSchema), validateBody(softwareCreateSchema), updateSoftware);
router.delete('/:id', validateParams(idParamSchema), deleteSoftware);

export default router;
