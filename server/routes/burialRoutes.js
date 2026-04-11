import express from 'express';
import { 
    getBurials, 
    getBurialById, 
    createBurial, 
    updateBurial, 
    deleteBurial 
} from '../controllers/burialController.js'; // Added .js extension

import { protect, adminOnly } from '../middleware/auth.js'; // Added .js extension

const router = express.Router();

// Anyone logged in can view
router.get('/', protect, getBurials);
router.get('/:id', protect, getBurialById);

// Staff/Admin can create or update (assuming 'protect' handles the role or logic)
router.post('/', protect, createBurial);
router.put('/:id', protect, updateBurial);

// Only Admin can delete a burial record
router.delete('/:id', protect, adminOnly, deleteBurial);

export default router;