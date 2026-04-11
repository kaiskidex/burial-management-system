import Permit from '../models/Permit.js';
import Plot from '../models/Plot.js';
import User from '../models/User.js';
import Burial from '../models/Burial.js';
import Lease from '../models/Lease.js';


// SEARCH OCCUPIED PLOTS
const searchOccupiedPlots = async (req, res) => {
    try {
        const { name } = req.query;
        const burials = await Burial.find({
            deceasedName: { $regex: name || '', $options: 'i' },
            status: 'occupied'
        }).populate('plotId');

        res.json(burials);
    } catch (error) {
        res.status(500).json({ message: 'Error searching records', error: error.message });
    }
};

// GET ALL PERMITS
const getPermits = async (req, res) => {
    try {
        const permits = await Permit.find()
            .populate('plotId', 'section plotNumber status')
            .populate('targetPlotId', 'section plotNumber status')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(permits);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching permits', error: error.message });
    }
};

// CREATE PERMIT
const createPermit = async (req, res) => {
    try {
        const {
            type, requesterName, requesterContact, requesterEmail,
            deceasedName, dateOfBirth, dateOfDeath,
            plotId, targetPlotId, remarks, officialReceiptNumber
        } = req.body;

        if (!plotId) {
            return res.status(400).json({ message: 'A primary plot must be selected.' });
        }

        if (type === 'transfer' && !targetPlotId) {
            return res.status(400).json({ message: 'Destination plot is required for transfers.' });
        }

        const permit = await Permit.create({
            type,
            requesterName,
            requesterContact,
            requesterEmail,
            deceasedName,
            dateOfBirth, 
            dateOfDeath, 
            plotId,
            targetPlotId: type === 'transfer' ? targetPlotId : null,
            officialReceiptNumber,
            remarks,
            status: 'pending'
        });

        res.status(201).json({ success: true, message: 'Permit request submitted', permit });
    } catch (error) {
        res.status(500).json({ message: 'Error creating permit', error: error.message });
    }
};


// APPROVE PERMIT
const approvePermit = async (req, res) => {
    try {
        const { status, adminRemarks } = req.body;
        const userId = req.user.id;

        const permit = await Permit.findById(req.params.id);
        if (!permit) return res.status(404).json({ message: 'Permit not found' });

        if (status === 'approved') {
            if (permit.type === 'interment') {
                await Plot.findByIdAndUpdate(permit.plotId, { status: 'reserved' });
            }
            else if (permit.type === 'transfer') {

                if (permit.targetPlotId) {
                    await Plot.findByIdAndUpdate(permit.targetPlotId, { status: 'reserved' });
                }
                await Plot.findByIdAndUpdate(permit.plotId, { status: 'occupied' });
            }
        }

        permit.status = status;
        permit.approvedBy = userId;
        if (adminRemarks) permit.adminNotes = adminRemarks;

        await permit.save();

        res.json({ success: true, message: `Permit ${status}.`, permit });
    } catch (error) {
        res.status(500).json({ message: 'Error processing approval', error: error.message });
    }
};


// COMPLETE PERMIT
const completePermit = async (req, res) => {
    try {
    

        const { date } = req.body;

        if (!date) {
            return res.status(400).json({ message: 'Completion date is required' });
        }

        const permit = await Permit.findById(req.params.id);
        if (!permit) {
            return res.status(404).json({ message: 'Permit not found' });
        }
        if (permit.status !== 'approved') {
            return res.status(400).json({ message: 'Only approved permits can be finalized.' });
        }

        // Store the completion date based on permit type
        if (date) {
            const completionDate = new Date(date);
            console.log("Setting completion date:", completionDate);

            if (permit.type === 'exhumation') {
                permit.exhumationCompleted = completionDate;
                console.log("Set exhumationCompleted");
            } else if (permit.type === 'transfer') {
                permit.transferCompleted = completionDate;
                console.log("Set transferCompleted");
            }
        }

        if (permit.type === 'interment') {
            console.log("Processing interment...");

            // Check if burial already exists
            let burial = await Burial.findOne({ permitId: permit._id });
            console.log("Existing burial found?", burial ? "Yes" : "No");

            if (!burial) {
                burial = await Burial.create({
                    deceasedName: permit.deceasedName,
                    dateOfBirth: permit.dateOfBirth,
                    dateOfDeath: permit.dateOfDeath,
                    dateOfInterment: date ? new Date(date) : new Date(),
                    plotId: permit.plotId,
                    permitId: permit._id,
                    status: 'occupied'
                });
                console.log("Created new burial:", burial._id);
            } else {
                // Update existing burial
                if (date) burial.dateOfInterment = new Date(date);
                await burial.save();
                console.log("Updated existing burial");
            }

            // Update plot status
            await Plot.findByIdAndUpdate(permit.plotId, {
                status: 'occupied',
                occupiedBy: burial._id
            
            });
            console.log("Updated plot status to occupied (no automatic lease)");
        }
        else if (permit.type === 'exhumation') {
            console.log("Processing exhumation...");

            // Find the burial record in the plot
            const burial = await Burial.findOne({ plotId: permit.plotId, status: 'occupied' });
            console.log("Found burial:", burial ? "Yes" : "No");

            if (burial) {
                // Update burial status to exhumed
                burial.status = 'exhumed';
                await burial.save();
                console.log("Updated burial status to exhumed");
            }

            // Clear the plot
            await Plot.findByIdAndUpdate(permit.plotId, {
                status: 'available',
                occupiedBy: null
            });
            console.log("Cleared plot");
        }
        else if (permit.type === 'transfer') {
            console.log("Processing transfer...");

            // Find the existing burial record
            const burial = await Burial.findOne({ plotId: permit.plotId, status: 'occupied' });
            console.log("Found burial:", burial ? "Yes" : "No");

            if (burial) {
                // Clear original plot
                await Plot.findByIdAndUpdate(permit.plotId, { status: 'available', occupiedBy: null });
                console.log("Cleared original plot");

                // Move Burial record to new plot
                burial.plotId = permit.targetPlotId;
                await burial.save();
                console.log("Moved burial to new plot");

                // Update destination plot
                await Plot.findByIdAndUpdate(permit.targetPlotId, {
                    status: 'occupied',
                    occupiedBy: burial._id
                });
                console.log("Updated destination plot");
            }
        }

        permit.status = 'completed';
        await permit.save();
        console.log("Permit status updated to completed");

        res.json({
            success: true,
            message: 'Process finalized and records updated.',
            permit
        });
    } catch (error) {
        console.error("Complete permit error:", error);
        console.error("Error stack:", error.stack);
        res.status(500).json({
            message: 'Error completing permit',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// UPDATE PERMIT (ADMIN ONLY FIELDS)
const updatePermit = async (req, res) => {
    try {
        const { exhumationCompleted, transferCompleted } = req.body;

        const permit = await Permit.findById(req.params.id);
        if (!permit) return res.status(404).json({ message: 'Permit not found' });

        if (permit.type === 'exhumation' && exhumationCompleted !== undefined) {
            permit.exhumationCompleted = exhumationCompleted;
        }

        if (permit.type === 'transfer' && transferCompleted !== undefined) {
            permit.transferCompleted = transferCompleted;
        }

        await permit.save();

        res.json({ success: true, message: 'Permit updated.', permit });

    } catch (error) {
        res.status(500).json({ message: 'Error updating permit', error: error.message });
    }
};

// HELPER METHODS
const getPermitsByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const permits = await Permit.find({ status })
            .populate('plotId')
            .populate('targetPlotId')
            .sort({ createdAt: -1 });
        res.json(permits);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching permits', error: error.message });
    }
};

const deletePermit = async (req, res) => {
    try {
        const permit = await Permit.findByIdAndDelete(req.params.id);
        if (!permit) return res.status(404).json({ message: 'Permit not found' });
        res.json({ success: true, message: 'Permit deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting permit', error: error.message });
    }
};

const getPermitById = async (req, res) => {
    try {
        const permit = await Permit.findById(req.params.id)
            .populate('plotId')
            .populate('targetPlotId')
            .populate('approvedBy', 'name');
        if (!permit) return res.status(404).json({ message: 'Permit not found' });
        res.json(permit);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching permit details', error: error.message });
    }
};

export {
    getPermits,
    searchOccupiedPlots,
    createPermit,
    approvePermit,
    completePermit,
    updatePermit,
    getPermitsByStatus,
    deletePermit,
    getPermitById
};