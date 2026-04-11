import express from 'express';
// Added .js extension
import { 
    register, 
    login, 
    getMe, 
    getAllUsers, 
    updateUserRole 
} from '../controllers/authController.js'; 

import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Public Routes
router.post('/register', register);
router.post('/login', login);

// Protected Routes 
router.get('/me', protect, getMe);

// Admin Routes
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/update-role', protect, adminOnly, updateUserRole);

export default router; // Changed from module.exports