import express from 'express';
import { runScan } from '../controllers/scanController.js';

const router = express.Router();

router.post('/', runScan);

export default router;
