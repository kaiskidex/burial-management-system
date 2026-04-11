import mongoose from "mongoose";

const plotSchema = new mongoose.Schema({
    section: { 
        type: String, 
        required: [true, 'Module designation is required'],
        uppercase: true,
        trim: true
    },
    plotNumber: { 
        type: String, 
        required: [true, 'Plot number is required'],
        uppercase: true,
        trim: true
    },
   
    status: { 
        type: String, 
        enum: ['available', 'occupied', 'reserved', 'expired', 'maintenance'], 
        default: 'available' 
    },
    
    coordinates: { 
        x: { type: Number, default: 0 }, 
        y: { type: Number, default: 0 } 
    },
    
    // Links to the Burial record (if occupied by a deceased)
    occupiedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Burial',
        default: null 
    },

    reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permit',
    default: null
},
    
    // Links to the current active lease
    currentLeaseId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Lease',
        default: null 
    },
    
    // Lease history tracking
    leaseHistory: [{
        leaseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lease'
        },
        startDate: Date,
        endDate: Date,
        ownerName: String
    }],
    
    // Plot type (for categorization)
    plotType: {
        type: String,
        enum: ['standard', 'family', 'memorial', 'columbarium'],
        default: 'standard'
    },
    
    // Price information
    price: {
        type: Number,
        default: 0
    },
    
    // Additional notes
    notes: {
        type: String,
        default: null
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Compound index to prevent duplicate plots
plotSchema.index({ section: 1, plotNumber: 1 }, { unique: true });
plotSchema.index({ status: 1 });
plotSchema.index({ currentLeaseId: 1 });

// Virtual to get full plot name
plotSchema.virtual('fullPlotName').get(function() {
    return `${this.section}-${this.plotNumber}`;
});

// Virtual to get current lease (populated)
plotSchema.virtual('currentLease', {
    ref: 'Lease',
    localField: 'currentLeaseId',
    foreignField: '_id',
    justOne: true
});

// Virtual to get plot display info for frontend
plotSchema.virtual('displayInfo').get(function() {
    return {
        id: this._id,
        name: `${this.section}-${this.plotNumber}`,
        section: this.section,
        plotNumber: this.plotNumber,
        status: this.status,
        isAvailable: this.status === 'available',
        isOccupied: this.status === 'occupied',
        occupiedByName: this.occupiedBy?.deceasedName || null
    };
});

// Method to check if plot is available
plotSchema.methods.isAvailable = function() {
    return this.status === 'available' && !this.currentLeaseId && !this.occupiedBy;
};

// Method to check if plot can be leased
plotSchema.methods.canBeLeased = function() {
    return this.status !== 'maintenance' && 
           this.status !== 'expired' && 
           (!this.currentLeaseId || this.status === 'available');
};

// Method to occupy plot with burial (with session support)
plotSchema.methods.occupy = async function(burialId, leaseId = null, session = null) {
    this.status = 'occupied';
    this.occupiedBy = burialId;
    if (leaseId) {
        this.currentLeaseId = leaseId;
    }
    
    if (session) {
        await this.save({ session });
    } else {
        await this.save();
    }
    return this;
};

// Method to release plot (make available) with session support
plotSchema.methods.release = async function(session = null) {
    this.status = 'available';
    this.occupiedBy = null;
    this.currentLeaseId = null;
    
    if (session) {
        await this.save({ session });
    } else {
        await this.save();
    }
    return this;
};

// Method to reserve plot with session support
plotSchema.methods.reserve = async function(session = null) {
    this.status = 'reserved';
    
    if (session) {
        await this.save({ session });
    } else {
        await this.save();
    }
    return this;
};

// Method to add lease to history with session support
plotSchema.methods.addLeaseToHistory = async function(leaseId, startDate, endDate, ownerName, session = null) {
    if (!this.leaseHistory) {
        this.leaseHistory = [];
    }
    
    this.leaseHistory.push({
        leaseId,
        startDate,
        endDate,
        ownerName
    });
    
    if (session) {
        await this.save({ session });
    } else {
        await this.save();
    }
    return this;
};

// Method to check status and sync with burial/lease
plotSchema.methods.checkStatus = async function() {
    // Check if occupiedBy burial still exists
    if (this.occupiedBy) {
        const burialExists = await mongoose.model('Burial').findById(this.occupiedBy);
        if (!burialExists) {
            this.status = 'available';
            this.occupiedBy = null;
            await this.save();
        }
    }
    
    // Check if lease is still active
    if (this.currentLeaseId) {
        const lease = await mongoose.model('Lease').findById(this.currentLeaseId);
        if (!lease || lease.status === 'cancelled' || lease.status === 'expired') {
            this.currentLeaseId = null;
            if (!this.occupiedBy) {
                this.status = 'available';
            }
            await this.save();
        }
    }
};

// Method to get lease history with populated data
plotSchema.methods.getLeaseHistory = async function() {
    if (!this.leaseHistory || this.leaseHistory.length === 0) {
        return [];
    }
    
    const leaseIds = this.leaseHistory.map(history => history.leaseId).filter(id => id);
    const leases = await mongoose.model('Lease').find({ _id: { $in: leaseIds } });
    
    return this.leaseHistory.map(history => {
        const lease = leases.find(l => l._id.toString() === history.leaseId?.toString());
        return {
            ...history.toObject(),
            leaseDetails: lease ? {
                ownerName: lease.ownerName,
                ownerEmail: lease.ownerEmail,
                ownerContact: lease.ownerContact,
                status: lease.status
            } : null
        };
    });
};

// Pre-save middleware to validate plot status consistency

plotSchema.pre('save', async function() {
    // Note: No 'next' argument needed here
    if (this.occupiedBy && this.status !== 'occupied') {
        this.status = 'occupied';
    }
    
    if (!this.occupiedBy && !this.currentLeaseId && this.status === 'occupied') {
        this.status = 'available';
    }
});

export default mongoose.model('Plot', plotSchema);