import Lease from '../models/Lease.js';
import Plot from '../models/Plot.js';
import Burial from '../models/Burial.js';
import mongoose from 'mongoose';

// HELPER FUNCTIONS

// Calculate days left until expiry (using UTC to avoid timezone issues)
const calculateDaysLeft = (endDate) => {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setUTCHours(0, 0, 0, 0);
    const diffTime = end - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
};

// Derive status based on days left (matching Leases.jsx)
const deriveStatus = (daysLeft) => {
    if (daysLeft === 0) return 'expired';
    if (daysLeft <= 90) return 'expiring_soon';
    return 'active';
};

// Format lease for frontend 
const formatLeaseForFrontend = (lease) => {
    // Get the raw lease object 
    const leaseObj = lease.toObject ? lease.toObject() : lease;
    
    
    // Get owner name with proper fallbacks
    let ownerName = 'Unknown Lessee';
    if (leaseObj.ownerName && leaseObj.ownerName !== 'Unknown Lessee') {
        ownerName = leaseObj.ownerName;
    } else if (leaseObj.lesseeName) {
        ownerName = leaseObj.lesseeName;
    } else if (leaseObj.name) {
        ownerName = leaseObj.name;
    }
    
    // Get email with proper fallbacks
    let email = 'N/A';
    if (leaseObj.ownerEmail && leaseObj.ownerEmail !== 'N/A') {
        email = leaseObj.ownerEmail;
    } else if (leaseObj.email) {
        email = leaseObj.email;
    }
    
    // Get contact number (not used in table but for completeness)
    let contactNumber = 'N/A';
    if (leaseObj.ownerContact) {
        contactNumber = leaseObj.ownerContact;
    } else if (leaseObj.contactNumber) {
        contactNumber = leaseObj.contactNumber;
    }
    
    // Get plot display name
    let plotDisplay = 'N/A';
    if (leaseObj.plotId) {
        if (typeof leaseObj.plotId === 'object') {
            // Populated plot object
            plotDisplay = leaseObj.plotId.fullPlotName || 
                         `${leaseObj.plotId.section || '?'}-${leaseObj.plotId.plotNumber || '?'}`;
        } else if (typeof leaseObj.plotId === 'string') {
            // Just an ID, need to handle this case
            plotDisplay = `Plot ID: ${leaseObj.plotId}`;
        }
    } else if (leaseObj.plot) {
        // Direct plot string from frontend
        plotDisplay = leaseObj.plot;
    }
    
    // Get dates
    let startDate = '';
    if (leaseObj.startDate) {
        startDate = new Date(leaseObj.startDate).toISOString().split('T')[0];
    }
    
    let expiryDate = '';
    if (leaseObj.endDate) {
        expiryDate = new Date(leaseObj.endDate).toISOString().split('T')[0];
    } else if (leaseObj.expiryDate) {
        expiryDate = new Date(leaseObj.expiryDate).toISOString().split('T')[0];
    }
    
    // Calculate days left
    let daysLeft = 0;
    if (leaseObj.daysLeft !== undefined && leaseObj.daysLeft !== null) {
        daysLeft = leaseObj.daysLeft;
    } else if (leaseObj.endDate) {
        daysLeft = calculateDaysLeft(leaseObj.endDate);
    }
    
    // Determine status text for frontend (capitalized as expected)
    let statusText = 'Active';
    if (daysLeft === 0) statusText = 'Expired';
    else if (daysLeft <= 90) statusText = 'Expiring Soon';
    
    // Override with status from lease if available
    if (leaseObj.statusText) {
        statusText = leaseObj.statusText;
    } else if (leaseObj.status) {
        if (leaseObj.status === 'expired') statusText = 'Expired';
        else if (leaseObj.status === 'expiring_soon') statusText = 'Expiring Soon';
        else if (leaseObj.status === 'active') statusText = 'Active';
    }
    
    // Get duration years
    const years = leaseObj.durationYears || 0;
    
    const formatted = {
        id: leaseObj._id || `#${Math.random().toString(36).substr(2, 4)}`,
        name: ownerName,
        email: email,
        contactNumber: contactNumber,
        plot: plotDisplay,
        startDate: startDate,
        expiryDate: expiryDate,
        daysLeft: daysLeft,
        status: statusText,
        years: years
    };
    
   
    return formatted;
};

// Validate date and duration
const validateLeaseDates = (startDate, durationYears) => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
        return { valid: false, message: 'Invalid start date' };
    }
    
    const years = parseInt(durationYears);
    if (isNaN(years) || years < 1 || years > 99) {
        return { valid: false, message: 'Duration must be between 1 and 99 years' };
    }
    
    return { valid: true, start };
};

// GET ALL LEASES (with filtering for Leases.jsx)
const getLeases = async (req, res) => {
    try {
        const { status, search, page = 1, limit = 50 } = req.query;

        let query = {};

        // Status filter (matching Leases.jsx)
        if (status && status !== 'All') {
            const statusMap = {
                'Active': 'active',
                'Expiring Soon': 'expiring_soon',
                'Expired': 'expired'
            };
            const mappedStatus = statusMap[status];
            if (mappedStatus) {
                query.status = mappedStatus;
            }
        }

        // Search filter (by name, email, OR plot number via plot lookup)
        if (search && search.trim()) {
            const searchTerm = search.trim();
            
            // First, find plots that match the search term (for plot number search)
            const matchingPlots = await Plot.find({
                $or: [
                    { section: { $regex: searchTerm, $options: 'i' } },
                    { plotNumber: { $regex: searchTerm, $options: 'i' } }
                ]
            }).select('_id');
            
            const plotIds = matchingPlots.map(p => p._id);
            
            query.$or = [
                { ownerName: { $regex: searchTerm, $options: 'i' } },
                { ownerEmail: { $regex: searchTerm, $options: 'i' } },
                { ownerContact: { $regex: searchTerm, $options: 'i' } }
            ];
            
            // Add plot ID search if any matches found
            if (plotIds.length > 0) {
                query.$or.push({ plotId: { $in: plotIds } });
            }
        }

        const leases = await Lease.find(query)
            .populate('plotId', 'section plotNumber status fullPlotName')
            .populate('burialRecordId', 'deceasedName dateOfDeath')
            .sort({ endDate: 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

   
        
        // Check first lease to see what fields exist
        if (leases.length > 0) {
            console.log('First lease raw data:', {
                id: leases[0]._id,
                ownerName: leases[0].ownerName,
                ownerEmail: leases[0].ownerEmail,
                ownerContact: leases[0].ownerContact,
                plotId: leases[0].plotId,
                startDate: leases[0].startDate,
                endDate: leases[0].endDate,
                durationYears: leases[0].durationYears,
                status: leases[0].status
            });
        }

        const total = await Lease.countDocuments(query);

        // Format leases for frontend
        const formattedLeases = leases.map(formatLeaseForFrontend);
        


        res.json({
            success: true,
            data: formattedLeases,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching leases:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching leases',
            error: error.message
        });
    }
};


// GET PUBLIC USER'S OWN LEASES
const getMyLeases = async (req, res) => {
    try {
        const userEmail = req.user.email;
        
        const leases = await Lease.find({ 
            ownerEmail: userEmail,
            status: { $in: ['active', 'expiring_soon'] }
        })
            .populate('plotId', 'section plotNumber status fullPlotName')
            .sort({ endDate: 1 });
        
        const formattedLeases = leases.map(formatLeaseForFrontend);
        
        res.json({
            success: true,
            data: formattedLeases
        });
    } catch (error) {
        console.error('Error fetching my leases:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching your leases',
            error: error.message
        });
    }
};




// GET LEASE STATISTICS (for summary cards)
const getLeaseStats = async (req, res) => {
    try {
        const total = await Lease.countDocuments();
        const active = await Lease.countDocuments({ status: 'active' });
        const expiringSoon = await Lease.countDocuments({ status: 'expiring_soon' });
        const expired = await Lease.countDocuments({ status: 'expired' });
        const cancelled = await Lease.countDocuments({ status: 'cancelled' });

        res.json({
            success: true,
            data: {
                total,
                active,
                expiringSoon,
                expired,
                cancelled
            }
        });
    } catch (error) {
        console.error('Error fetching lease stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lease statistics',
            error: error.message
        });
    }
};

// GET SINGLE LEASE BY ID
const getLeaseById = async (req, res) => {
    try {
        const lease = await Lease.findById(req.params.id)
            .populate('plotId', 'section plotNumber status fullPlotName coordinates')
            .populate('burialRecordId', 'deceasedName dateOfDeath dateOfInterment');

        if (!lease) {
            return res.status(404).json({ 
                success: false,
                message: 'Lease not found' 
            });
        }

        const formattedLease = formatLeaseForFrontend(lease);
        res.json({
            success: true,
            data: formattedLease
        });
    } catch (error) {
        console.error('Error fetching lease:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching lease',
            error: error.message
        });
    }
};

// CREATE LEASE
const createLease = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        
        // Destructure with all possible field names
        const {
        
            ownerName,
            ownerEmail,
            ownerContact,
            plotId,
            startDate,
            durationYears,
           
            name,
            email,
            contactNumber,
            plot: plotIdentifier,
            years,
            lesseeName,
            burialRecordId
        } = req.body;

        // Determine the actual values (prioritize frontend field names)
        const finalOwnerName = ownerName || name || lesseeName;
        const finalOwnerEmail = ownerEmail || email;
        const finalOwnerContact = ownerContact || contactNumber;
        const finalDurationYears = parseInt(durationYears || years);
        
        // Validate required fields
        if (!finalOwnerName || finalOwnerName.trim() === '') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'Lessee name is required' 
            });
        }
        
        if (!finalOwnerContact || finalOwnerContact.trim() === '') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'Contact number is required' 
            });
        }
        
        if (!finalOwnerEmail || !finalOwnerEmail.includes('@')) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'Valid email address is required' 
            });
        }
        
        if (!startDate) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'Start date is required' 
            });
        }
        
        if (!finalDurationYears || finalDurationYears < 1 || finalDurationYears > 99) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'Lease duration must be between 1 and 99 years' 
            });
        }
        
        // Find the plot
        let plot = null;
        
        if (plotId) {
            plot = await Plot.findById(plotId).session(session);
        } else if (plotIdentifier) {
            const plotNumberParts = plotIdentifier.split('-');
            if (plotNumberParts.length === 2) {
                const section = plotNumberParts[0];
                const plotNumber = plotNumberParts[1];
                plot = await Plot.findOne({ section, plotNumber }).session(session);
            }
        }
        
        if (!plot) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ 
                success: false,
                message: 'Plot not found. Please ensure the plot exists and is occupied.' 
            });
        }
        

        
        // Check if plot already has active lease
        const existingLease = await Lease.findOne({
            plotId: plot._id,
            status: { $in: ['active', 'expiring_soon'] }
        }).session(session);
        
        if (existingLease) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'Plot already has an active lease'
            });
        }
        
        // Calculate dates
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        
        const endDate = new Date(start);
        endDate.setUTCFullYear(endDate.getUTCFullYear() + finalDurationYears);
        
        const daysLeft = calculateDaysLeft(endDate);
        const status = deriveStatus(daysLeft);
        
        // Create lease
        const leaseData = {
            plotId: plot._id,
            ownerName: finalOwnerName,
            ownerEmail: finalOwnerEmail,
            ownerContact: finalOwnerContact,
            startDate: start,
            endDate: endDate,
            durationYears: finalDurationYears,
            burialRecordId: burialRecordId || null,
            status: status,
            daysLeft: daysLeft,
            notified30Days: false,
            notified7Days: false,
            notifiedExpired: false,
            renewalCount: 0
        };
        
        const lease = await Lease.create([leaseData], { session });
        const createdLease = lease[0];
        
    
        
        // Update plot with new lease
        plot.currentLeaseId = createdLease._id;
        
        // If plot is occupied but has no burial record linked, don't change status
        if (plot.status !== 'occupied') {
            plot.status = 'occupied';
        }
        
        await plot.save({ session });
        
        // Add to lease history
        try {
            await plot.addLeaseToHistory(
                createdLease._id, 
                start, 
                endDate, 
                finalOwnerName
            );
        } catch (historyError) {
            console.log("Warning: Could not add to lease history:", historyError.message);
        }
        
        await session.commitTransaction();
        session.endSession();
        
        const formattedLease = formatLeaseForFrontend(createdLease);
        
        res.status(201).json({
            success: true,
            message: 'Lease registered successfully',
            data: formattedLease
        });
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error("Create lease error details:", error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: messages
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating lease',
            error: error.message
        });
    }
};
// RENEW LEASE (Matches RenewModal in Leases.jsx)
const renewLease = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { startDate, durationYears, years } = req.body;
        const finalDuration = parseInt(durationYears || years);
        
        // Validate input
        if (!startDate) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'New start date is required for renewal' 
            });
        }
        
        if (!finalDuration || finalDuration < 1 || finalDuration > 99) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'Valid duration between 1 and 99 years is required' 
            });
        }
        
        const lease = await Lease.findById(req.params.id).session(session);
        
        if (!lease) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ 
                success: false,
                message: 'Lease not found' 
            });
        }
        
        // Check if lease is terminated
        if (lease.status === 'cancelled') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'Cannot renew a terminated lease' 
            });
        }
        
        // Calculate new dates
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        
        // Validate that new start date is not in the past (allow same day)
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (start < today) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'Renewal start date cannot be in the past' 
            });
        }
        
        // Calculate new end date
        const newEndDate = new Date(start);
        newEndDate.setUTCFullYear(newEndDate.getUTCFullYear() + finalDuration);
        
        // Calculate new days left
        const daysLeft = calculateDaysLeft(newEndDate);
        const newStatus = deriveStatus(daysLeft);
        
        // Update lease using direct assignment (the model's renew method has issues)
        lease.startDate = start;
        lease.endDate = newEndDate;
        lease.durationYears = finalDuration;
        lease.renewedAt = new Date();
        lease.renewalCount = (lease.renewalCount || 0) + 1;
        lease.status = newStatus;
        lease.daysLeft = daysLeft;
        
        // Reset notification flags
        lease.notified30Days = false;
        lease.notified7Days = false;
        lease.notifiedExpired = false;
        
        await lease.save({ session });
        
        // Update plot's lease history
        const plot = await Plot.findById(lease.plotId).session(session);
        if (plot) {
            // If plot was expired, mark it as occupied again
            if (plot.status === 'expired') {
                plot.status = 'occupied';
                await plot.save({ session });
            }
            
            // Add to history
            try {
                await plot.addLeaseToHistory(lease._id, start, newEndDate, lease.ownerName);
            } catch (historyError) {
                console.log("Warning: Could not add to lease history:", historyError.message);
            }
        }
        
        await session.commitTransaction();
        session.endSession();
        
        const formattedLease = formatLeaseForFrontend(lease);
        
        res.json({
            success: true,
            message: 'Lease renewed successfully',
            data: formattedLease
        });
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Error renewing lease:', error);
        res.status(500).json({
            success: false,
            message: 'Error renewing lease',
            error: error.message
        });
    }
};

// TERMINATE LEASE (Matches TerminateModal in Leases.jsx)
const terminateLease = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { reason } = req.body;
        const lease = await Lease.findById(req.params.id).session(session);
        
        if (!lease) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ 
                success: false,
                message: 'Lease not found' 
            });
        }
        
        // Check if already terminated
        if (lease.status === 'cancelled') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                success: false,
                message: 'Lease is already terminated' 
            });
        }
        
        // Update lease status
        lease.status = 'cancelled';
        lease.terminatedAt = new Date();
        lease.terminationReason = reason || 'Terminated by administrator';
        lease.daysLeft = 0;
        
        await lease.save({ session });
        
        // Update the plot to make it available again
        const plot = await Plot.findById(lease.plotId).session(session);
        if (plot) {
            // Only make plot available if there's no burial record occupying it
            if (!plot.occupiedBy) {
                plot.status = 'available';
                plot.currentLeaseId = null;
            } else {
                // If there's a burial, keep as occupied but remove lease reference
                plot.currentLeaseId = null;
            }
            await plot.save({ session });
        }
        
        await session.commitTransaction();
        session.endSession();
        
        res.json({
            success: true,
            message: 'Lease terminated successfully'
        });
        
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Error terminating lease:', error);
        res.status(500).json({
            success: false,
            message: 'Error terminating lease',
            error: error.message
        });
    }
};

// GET EXPIRING LEASES (For notifications)
const getExpiringLeases = async (req, res) => {
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setUTCDate(today.getUTCDate() + 30);
        
        const expiringLeases = await Lease.find({
            status: { $in: ['active', 'expiring_soon'] },
            endDate: { $gte: today, $lte: thirtyDaysLater },
            notified30Days: false
        })
            .populate('plotId', 'section plotNumber fullPlotName')
            .populate('burialRecordId', 'deceasedName');
        
        const formattedLeases = expiringLeases.map(lease => ({
            id: lease._id,
            ownerName: lease.ownerName,
            ownerEmail: lease.ownerEmail,
            ownerContact: lease.ownerContact,
            plot: lease.plotId?.fullPlotName || `${lease.plotId?.section}-${lease.plotId?.plotNumber}`,
            endDate: lease.endDate,
            daysLeft: calculateDaysLeft(lease.endDate)
        }));
        
        res.json({
            success: true,
            data: formattedLeases
        });
    } catch (error) {
        console.error('Error fetching expiring leases:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expiring leases',
            error: error.message
        });
    }
};

// MARK NOTIFICATION SENT (Update notified flags)
const markNotificationSent = async (req, res) => {
    try {
        const { id } = req.params;
        const { notificationType } = req.body;
        
        const lease = await Lease.findById(id);
        if (!lease) {
            return res.status(404).json({ 
                success: false,
                message: 'Lease not found' 
            });
        }
        
        if (notificationType === '30days') {
            lease.notified30Days = true;
        } else if (notificationType === '7days') {
            lease.notified7Days = true;
        } else if (notificationType === 'expired') {
            lease.notifiedExpired = true;
        } else {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification type'
            });
        }
        
        await lease.save();
        
        res.json({
            success: true,
            message: 'Notification flag updated'
        });
    } catch (error) {
        console.error('Error updating notification flag:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating notification flag',
            error: error.message
        });
    }
};

// UPDATE LEASE STATUS (Check for expired leases)
const updateLeaseStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const lease = await Lease.findById(req.params.id);
        
        if (!lease) {
            return res.status(404).json({ 
                success: false,
                message: 'Lease not found' 
            });
        }
        
        const validStatuses = ['active', 'expiring_soon', 'expired', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }
        
        lease.status = status;
        
        // Update days left based on status
        if (status === 'expired') {
            lease.daysLeft = 0;
        } else if (status === 'active') {
            lease.daysLeft = calculateDaysLeft(lease.endDate);
        }
        
        await lease.save();
        
        // If lease expired, update plot status
        if (status === 'expired') {
            await Plot.findByIdAndUpdate(lease.plotId, {
                status: 'expired'
            });
        } else if (status === 'cancelled') {
            const plot = await Plot.findById(lease.plotId);
            if (plot && !plot.occupiedBy) {
                plot.status = 'available';
                plot.currentLeaseId = null;
                await plot.save();
            }
        }
        
        res.json({
            success: true,
            message: `Lease marked as ${status}`,
            data: { status: lease.status, daysLeft: lease.daysLeft }
        });
    } catch (error) {
        console.error('Error updating lease status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating lease status',
            error: error.message
        });
    }
};

// AUTO-UPDATE EXPIRED LEASES (Cron job endpoint)
const autoUpdateExpiredLeases = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        // Find all active/expiring leases that have expired
        const expiredLeases = await Lease.find({
            status: { $in: ['active', 'expiring_soon'] },
            endDate: { $lt: today }
        }).session(session);
        
        const updatedLeases = [];
        
        for (const lease of expiredLeases) {
            lease.status = 'expired';
            lease.daysLeft = 0;
            await lease.save({ session });
            updatedLeases.push(lease._id);
            
            // Update plot status
            await Plot.findByIdAndUpdate(
                lease.plotId, 
                { status: 'expired' },
                { session }
            );
        }
        
        await session.commitTransaction();
        session.endSession();
        
        res.json({
            success: true,
            message: `Updated ${updatedLeases.length} expired leases`,
            updatedCount: updatedLeases.length
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Error updating expired leases:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating expired leases',
            error: error.message
        });
    }
};

// DELETE LEASE (Admin only - with soft delete option)
const deleteLease = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const lease = await Lease.findById(req.params.id).session(session);
        
        if (!lease) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ 
                success: false,
                message: 'Lease not found' 
            });
        }
        
        // Check if lease is already terminated - prevent deletion of active leases
        if (lease.status !== 'cancelled' && lease.status !== 'expired') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'Cannot delete active lease. Please terminate it first.'
            });
        }
        
        // Update the plot before deleting the lease reference
        const plot = await Plot.findById(lease.plotId).session(session);
        if (plot) {
            if (plot.currentLeaseId?.toString() === lease._id.toString()) {
                plot.currentLeaseId = null;
            }
            if (!plot.occupiedBy) {
                plot.status = 'available';
            }
            await plot.save({ session });
        }
        
        // Remove from lease history in plot
        if (plot && plot.leaseHistory) {
            plot.leaseHistory = plot.leaseHistory.filter(
                history => history.leaseId?.toString() !== lease._id.toString()
            );
            await plot.save({ session });
        }
        
        await lease.deleteOne({ session });
        
        await session.commitTransaction();
        session.endSession();
        
        res.json({
            success: true,
            message: 'Lease deleted successfully'
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        
        console.error('Error deleting lease:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting lease',
            error: error.message
        });
    }
};


const updateLease = async (req, res) => {
    try {
        const { id } = req.params;

        // Use req.body to handle any field sent (name, email, etc.)
        const updatedLease = await Lease.findByIdAndUpdate(
            id, 
            req.body, 
            { new: true, runValidators: true }
        );

        if (!updatedLease) {
            return res.status(404).json({
                success: false,
                message: "Lease record not found."
            });
        }

        res.status(200).json({
            success: true,
            data: updatedLease
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message || "Failed to update lease record."
        });
    }
};

export {
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
    getMyLeases
};