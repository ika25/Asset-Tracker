import express from 'express';
import {
  getDevices,
  createDevice,
  updateDevice,
  deleteDevice
} from '../controllers/deviceController.js';

const router = express.Router();

router.get('/', getDevices);
router.post('/', createDevice);
router.put('/:id', updateDevice);
router.delete('/:id', deleteDevice);

export default router;