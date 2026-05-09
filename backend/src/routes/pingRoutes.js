import express from 'express';
import { pingDevice, pingAllDevices } from '../controllers/pingController.js';

const router = express.Router();

// Ping a single device by its DB ID
router.get('/:id', pingDevice);

// Batch ping all (or a filtered set of) devices
router.post('/batch', pingAllDevices);

export default router;
