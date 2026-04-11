import express from 'express';
// Added adminOnly to the import list to match your delete route
import { protect, restrictTo, adminOnly } from '../middleware/auth.js';

// Changed require to import and added .js extension
import {
    getPermits,
    getPermitById,
    createPermit,
    approvePermit,
    completePermit,
    deletePermit,
    getPermitsByStatus,
    updatePermit
} from '../controllers/permitController.js';

const router = express.Router();

// PUBLIC OR SHARED ROUTES
// Anyone can submit a permit request (Citizen or Staff)
router.post('/', protect, restrictTo('staff'), createPermit);

// PROTECTED ROUTES (Requires Login)
router.get('/', protect, getPermits);
router.get('/status/:status', protect, getPermitsByStatus);
router.get('/:id', protect, getPermitById);

// WORKFLOW ACTIONS (Requires Login)
router.put('/:id/approve', protect, restrictTo('admin'), approvePermit);
router.put('/:id/complete', protect, restrictTo('staff', 'admin'), completePermit);
router.put('/:id', protect, restrictTo('admin'), updatePermit);

// DESTRUCTIVE ACTIONS (Admin Only)
// Using adminOnly here works now because it's in the import list above
router.delete('/:id', protect, adminOnly, deletePermit);

export default router;