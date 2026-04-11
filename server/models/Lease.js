import mongoose from "mongoose";

const leaseSchema = new mongoose.Schema({
    plotId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plot', 
        required: [true, 'Lease must be linked to a plot'] 
    },
    burialRecordId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Burial' 
    },
    ownerName: { 
        type: String, 
        required: [true, 'Lease owner name is required'],
        trim: true
    },
    ownerContact: { 
        type: String, 
        required: [true, 'Owner contact number is required'],
        trim: true
    },
    ownerEmail: { 
        type: String,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    startDate: { 
        type: Date, 
        default: Date.now,
        required: [true, 'Start date is required']
    },
    endDate: { 
        type: Date, 
        required: [true, 'Lease expiration date is required'] 
    },
    durationYears: {
        type: Number,
        required: [true, 'Lease duration is required'],
        min: 1,
        max: 99
    },
    renewedAt: { type: Date },
    renewalCount: { type: Number, default: 0 },
    status: { 
        type: String, 
        enum: ['active', 'expiring_soon', 'expired', 'renewed', 'cancelled'], 
        default: 'active' 
    },
    daysLeft: { type: Number, default: 0 },
    notified30Days: { type: Boolean, default: false },
    notified7Days: { type: Boolean, default: false },
    notifiedExpired: { type: Boolean, default: false },
    terminatedAt: { type: Date, default: null },
    terminationReason: { type: String, default: null },
    remarks: { type: String, default: null }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});



leaseSchema.virtual('calculatedDaysLeft').get(function() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(this.endDate);
    const diffTime = end - today;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, daysLeft);
});

leaseSchema.virtual('statusText').get(function() {
    const daysLeft = this.daysLeft || this.calculatedDaysLeft;
    if (daysLeft === 0) return 'Expired';
    if (daysLeft <= 90) return 'Expiring Soon';
    return 'Active';
});

leaseSchema.index({ plotId: 1 });
leaseSchema.index({ status: 1 });
leaseSchema.index({ endDate: 1 });
leaseSchema.index({ ownerName: 'text', ownerEmail: 'text' });
leaseSchema.index({ daysLeft: 1 });

leaseSchema.methods.isExpiringSoon = function() {
    return this.daysLeft <= 90 && this.daysLeft > 0;
};

leaseSchema.methods.renew = async function(newStartDate, additionalYears) {
    const start = new Date(newStartDate);
    const newEndDate = new Date(start);
    newEndDate.setFullYear(newEndDate.getFullYear() + additionalYears);
    
    this.startDate = start;
    this.endDate = newEndDate;
    this.durationYears = additionalYears;
    this.renewedAt = Date.now();
    this.renewalCount += 1;
    this.status = 'renewed';
    
    this.notified30Days = false;
    this.notified7Days = false;
    this.notifiedExpired = false;
    
    return this;
};

leaseSchema.methods.terminate = async function(reason) {
    this.status = 'cancelled';
    this.terminatedAt = Date.now();
    this.terminationReason = reason || 'Terminated by administrator';
    this.daysLeft = 0;
    return this;
};

export default mongoose.model('Lease', leaseSchema);