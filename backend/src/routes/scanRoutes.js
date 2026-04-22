import express from 'express';
import { runScan } from '../controllers/scanController.js';

const router = express.Router();

// GET keeps scan easy to trigger from browser/manual testing.
router.get('/', runScan);

export default router;