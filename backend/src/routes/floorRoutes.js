import express from 'express';
import {
  getFloors,
  createFloor,
  updateFloor,
  deleteFloor
} from '../controllers/floorController.js';

const router = express.Router();

router.get('/', getFloors);
router.post('/', createFloor);
router.put('/:id', updateFloor);
router.delete('/:id', deleteFloor);

export default router;
