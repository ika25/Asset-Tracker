// Express router
import express from 'express';

// Controller functions
import {
  getHardware,
  createHardware,
  updateHardware,
  deleteHardware,
} from '../controllers/hardwareController.js';

const router = express.Router();

// =========================
// Routes
// =========================
router.get('/', getHardware);        // GET all
router.post('/', createHardware);    // CREATE
router.put('/:id', updateHardware);  // UPDATE
router.delete('/:id', deleteHardware); // DELETE

export default router;