import express from 'express';
import multer from 'multer';
import { getSoftware, createSoftware, updateSoftware, deleteSoftware, bulkDeleteSoftware, importSoftwareFromCSV, exportSoftwareToCSV } from '../controllers/softwareController.js';
import { validateBody, validateParams } from '../middleware/validate.js';
import { idParamSchema, softwareCreateSchema, bulkDeleteSchema } from '../validation/schemas.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getSoftware);
router.post('/', validateBody(softwareCreateSchema), createSoftware);
router.post('/bulk-delete', validateBody(bulkDeleteSchema), bulkDeleteSoftware);
router.post('/import/csv', upload.single('file'), importSoftwareFromCSV);
router.get('/export/csv', exportSoftwareToCSV);
router.put('/:id', validateParams(idParamSchema), validateBody(softwareCreateSchema), updateSoftware);
router.delete('/:id', validateParams(idParamSchema), deleteSoftware);

export default router;
