import express from 'express';
import {
    getLeases,
    getLeaseStats,
    getLeaseById,
    createLease,
    renewLease,
    terminateLease,
    getExpiringLeases,
    markNotificationSent,
    updateLeaseStatus,
    autoUpdateExpiredLeases,
    deleteLease,
    updateLease,
    getMyLeases  // Make sure this is imported
} from '../controllers/leaseController.js';

import { protect, restrictTo, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// PUBLIC ROUTES (Must be before /:id routes)

// Public user can view their own leases
router.get('/my-leases', protect, getMyLeases);

// ROUTES ACCESSIBLE BY BOTH ADMIN AND STAFF

// Statistics for summary cards
router.get('/stats', protect, restrictTo('admin', 'staff'), getLeaseStats);

// Get expiring leases for notifications
router.get('/expiring', protect, restrictTo('admin', 'staff'), getExpiringLeases);

// Get all leases with filtering
router.get('/', protect, restrictTo('admin', 'staff'), getLeases);

// Get single lease by ID
router.get('/:id', protect, restrictTo('admin', 'staff'), getLeaseById);

// STAFF-ONLY ROUTES (Can create, renew, terminate)

// Create new lease
router.post('/', protect, restrictTo('staff', 'admin'), createLease);

// Renew existing lease
router.put('/:id/renew', protect, restrictTo('staff', 'admin'), renewLease);

// Terminate lease
router.delete('/:id/terminate', protect, restrictTo('staff', 'admin'), terminateLease);
router.post('/:id/terminate', protect, restrictTo('staff', 'admin'), terminateLease);

// ADMIN-ONLY ROUTES (System management)

router.post('/auto-update-expired', protect, adminOnly, autoUpdateExpiredLeases);
router.put('/:id/status', protect, adminOnly, updateLeaseStatus);
router.put('/:id/notification', protect, adminOnly, markNotificationSent);
router.put('/:id', protect, adminOnly, updateLease);
router.delete('/:id', protect, adminOnly, deleteLease);

export default router;