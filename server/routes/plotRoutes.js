import express from 'express';
import { 
    getPlots, 
    getPlotsBySection, 
    getMapData, 
    createPlot, 
    generatePlots, 
    updatePlotStatus, 
    deletePlot, 
    searchOccupiedPlots 
} from '../controllers/plotController.js'; // Added .js

import { protect, restrictTo, adminOnly } from '../middleware/auth.js'; // Added .js

const router = express.Router();

// PUBLIC / VIEWING ROUTES
router.get('/', protect, getPlots);
router.get('/search/occupied', protect, searchOccupiedPlots);
router.get('/map-data', protect, getMapData); 
router.get('/section/:section', protect, getPlotsBySection);

// ADMIN ONLY ROUTES
router.post('/', protect, adminOnly, createPlot);
router.post('/generate', protect, restrictTo('admin', 'staff'), generatePlots);
router.put('/:id', protect, adminOnly, updatePlotStatus); 
router.delete('/:id', protect, adminOnly, deletePlot);

export default router; 