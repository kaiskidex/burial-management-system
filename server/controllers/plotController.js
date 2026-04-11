import Plot from '../models/Plot.js';
import Burial from '../models/Burial.js';
import Permit from '../models/Permit.js';


// GET ALL PLOTS
const getPlots = async (req, res) => {
    try {
        // get plots with occupied info
        const plots = await Plot.find()
            .populate('occupiedBy')
            .populate('currentLeaseId')
            .lean();

        const permits = await Permit.find({ status: 'approved' })
            .select('plotId deceasedName requesterName type targetPlotId')
            .lean();

        // attach reserved info to plots
        const plotsWithReserved = plots.map(plot => {
            const permit = permits.find(p => {
               if (p.type === 'interment') {
                   return p.plotId?.toString() === plot._id.toString();
               }
               if (p.type === 'transfer') {
                   return p.targetPlotId?.toString() === plot._id.toString();
               }
               return false;
            });

            // Format lease data safely
            let leaseData = null;
            if (plot.currentLeaseId) {
                leaseData = {
                    _id: plot.currentLeaseId._id,
                    ownerName: plot.currentLeaseId.ownerName,
                    ownerEmail: plot.currentLeaseId.ownerEmail,
                    ownerContact: plot.currentLeaseId.ownerContact,
                    startDate: plot.currentLeaseId.startDate,
                    endDate: plot.currentLeaseId.endDate,
                    durationYears: plot.currentLeaseId.durationYears,
                    status: plot.currentLeaseId.status,
                    daysLeft: plot.currentLeaseId.daysLeft
                };
            }

            return {
                ...plot,
                status: permit ? 'reserved' : plot.status,
                reservedBy: permit ? {
                    deceasedName: permit.deceasedName,
                    requesterName: permit.requesterName
                } : null,
                currentLease: leaseData
            };
        });

        res.json(plotsWithReserved);
    } catch (error) {
        console.error('Error in getPlots:', error);
        res.status(500).json({ message: 'Error fetching plots', error: error.message });
    }
};


// GET PLOTS BY SECTION
const getPlotsBySection = async (req, res) => {
    try {
        const plots = await Plot.find({ section: req.params.section }).populate('occupiedBy');
        res.json(plots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching section plots', error: error.message });
    }
};


// GET MAP DATA
const getMapData = async (req, res) => {
    try {
        const plots = await Plot.find().populate('occupiedBy').select('section plotNumber status coordinates occupiedBy');
        res.json(plots);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching map data', error: error.message });
    }
};


// CREATE SINGLE PLOT (Admin)
const createPlot = async (req, res) => {
    try {
        const { section, plotNumber, coordinates } = req.body;
        if (!section || !plotNumber) {
            return res.status(400).json({ message: 'Section and plot number are required.' });
        }
        const plot = await Plot.create({ section, plotNumber, coordinates });
        res.status(201).json(plot);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Plot already exists in this section.' });
        }
        res.status(500).json({ message: 'Error creating plot', error: error.message });
    }
};


// GENERATE NEW MODULE
const generatePlots = async (req, res) => {
    try {
        const PLOTS_PER_MODULE = 20;
        const lastPlot = await Plot.findOne().sort({ createdAt: -1 });
        const nextModule = getNextModuleName(lastPlot ? lastPlot.section : null);

        const newPlots = [];
        let currentX = 0;
        let currentY = 0;
        const plotsPerRow = 10;
        const spacing = 50;

        for (let i = 1; i <= PLOTS_PER_MODULE; i++) {
            newPlots.push({
                section: nextModule,
                plotNumber: i.toString().padStart(3, '0'),
                coordinates: { x: currentX, y: currentY },
                status: 'available'
            });

            if (i % plotsPerRow === 0) {
                currentX = 0;
                currentY += spacing;
            } else {
                currentX += spacing;
            }
        }

        const createdPlots = await Plot.insertMany(newPlots);

        res.status(201).json({
            success: true,
            message: `Successfully generated ${nextModule} with ${PLOTS_PER_MODULE} plots.`,
            moduleName: nextModule,
            count: createdPlots.length
        });

    } catch (error) {
        res.status(500).json({ message: 'Error generating module', error: error.message });
    }
};

// Helper function for module naming
const getNextModuleName = (lastModule) => {
    if (!lastModule) return "Module 1A";

    const code = lastModule.replace("Module ", "");
    const numericPart = parseInt(code.slice(0, -1));
    const letterPart = code.slice(-1);

    if (isNaN(numericPart)) {
        return code === 'Z' ? "Module 2A" : `Module ${String.fromCharCode(code.charCodeAt(0) + 1)}`;
    }

    return letterPart === 'Z'
        ? `Module ${numericPart + 1}A`
        : `Module ${numericPart}${String.fromCharCode(letterPart.charCodeAt(0) + 1)}`;
};


// UPDATE PLOT STATUS
const updatePlotStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const plot = await Plot.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );
        if (!plot) return res.status(404).json({ message: 'Plot not found' });
        res.json(plot);
    } catch (error) {
        res.status(500).json({ message: 'Error updating plot', error: error.message });
    }
};


// DELETE PLOT
const deletePlot = async (req, res) => {
    try {
        const plot = await Plot.findByIdAndDelete(req.params.id);
        if (!plot) return res.status(404).json({ message: 'Plot not found' });
        res.json({ message: 'Plot deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting plot', error: error.message });
    }
};

// SEARCH OCCUPIED PLOTS
const searchOccupiedPlots = async (req, res) => {
    try {
        const { name } = req.query;

        const burials = await Burial.find({
            deceasedName: { $regex: name || '', $options: 'i' }
        }).select('_id');

        const burialIds = burials.map(b => b._id);

        const plots = await Plot.find({
            status: 'occupied',
            occupiedBy: { $in: burialIds }
        }).populate('occupiedBy').limit(10);

        res.json(plots);
    } catch (error) {
        res.status(500).json({ message: 'Error searching records', error: error.message });
    }
};

export {
    getPlots,
    getPlotsBySection,
    getMapData,
    createPlot,
    generatePlots,
    updatePlotStatus,
    deletePlot,
    searchOccupiedPlots
};