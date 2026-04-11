import express from 'express';
import { runScan } from '../controllers/scanController.js';

const router = express.Router();

// Allow GET for testing in browser
router.get('/', runScan); // ✅ add this

export default router;