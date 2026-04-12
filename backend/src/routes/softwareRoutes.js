import express from 'express';
import { getSoftware, createSoftware, updateSoftware, deleteSoftware } from '../controllers/softwareController.js';

const router = express.Router();

router.get('/', getSoftware);
router.post('/', createSoftware);
router.put('/:id', updateSoftware);
router.delete('/:id', deleteSoftware);

export default router;
