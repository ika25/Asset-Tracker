import express from 'express';
import {
  assignSoftware,
  getDeviceSoftware,
} from '../controllers/deviceSoftwareController.js';

const router = express.Router();

// Assign software
router.post('/', assignSoftware);

// Get software for device
router.get('/:deviceId', getDeviceSoftware);

export default router;