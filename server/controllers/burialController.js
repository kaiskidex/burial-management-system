
import Burial from '../models/Burial.js';
import Plot from '../models/Plot.js';

// Get all burial records (including exhumed)
const getBurials = async (req, res) => {
    try {
        const burials = await Burial.find().populate('plotId', 'section plotNumber');
        res.json(burials);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get single burial record
const getBurialById = async (req, res) => {
    try {
        const burial = await Burial.findById(req.params.id).populate('plotId');
        if (!burial) {
            return res.status(404).json({ message: 'Burial record not found' });
        }
        res.json(burial);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create burial record
const createBurial = async (req, res) => {
    try {
        const { deceasedName, dateOfDeath, dateOfInterment, plotId } = req.body;

        const plot = await Plot.findById(plotId);
        if (!plot || plot.status !== 'available') {
            return res.status(400).json({ message: 'Plot is not available or does not exist' });
        }

        // Create the burial record first
        const burial = await Burial.create({
            deceasedName,
            dateOfDeath,
            dateOfInterment,
            plotId
        });

        // Update the plot only if successful
        plot.status = 'occupied';
        plot.occupiedBy = burial._id;
        await plot.save();

        res.status(201).json(burial);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateBurial = async (req, res) => {
    try {
        const { plotId: newPlotId } = req.body;
        const oldBurial = await Burial.findById(req.params.id);
        
        if (!oldBurial) {
            return res.status(404).json({ message: 'Burial record not found' });
        }

        // Check if the plot is actually being changed
        if (newPlotId && newPlotId.toString() !== oldBurial.plotId.toString()) {
            
            // Check if the NEW plot is available
            const newPlot = await Plot.findById(newPlotId);
            if (!newPlot || newPlot.status !== 'available') {
                return res.status(400).json({ message: 'New plot is not available' });
            }

            // Free up the OLD plot
            await Plot.findByIdAndUpdate(oldBurial.plotId, { status: 'available', occupiedBy: null });

            // Occupy the NEW plot
            newPlot.status = 'occupied';
            newPlot.occupiedBy = oldBurial._id;
            await newPlot.save();
        }

        // Update the burial record itself
        const updatedBurial = await Burial.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedBurial);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete burial record
const deleteBurial = async (req, res) => {
    try {
        const burial = await Burial.findById(req.params.id);
        if (!burial) {
            return res.status(404).json({ message: 'Burial record not found' });
        }
        
        // Free up the plot
        if (burial.plotId) {
            await Plot.findByIdAndUpdate(burial.plotId, { status: 'available', occupiedBy: null });
        }
        
        await burial.deleteOne();
        res.json({ message: 'Burial record deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export {
    getBurials,
    getBurialById,
    createBurial,
    updateBurial,
    deleteBurial
};