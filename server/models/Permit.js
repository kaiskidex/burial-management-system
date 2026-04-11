import mongoose from "mongoose";

const permitSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['interment', 'exhumation', 'transfer'], 
        required: [true, 'Permit type is required'] 
    },
    requesterName: { type: String, required: true },
    requesterContact: { type: String, required: true },
    requesterEmail: String,
    
    // Deceased Information
    deceasedName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true }, 
    dateOfDeath: { type: Date, required: true }, 
    
    // Source Location (For all types)
    plotId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plot',
        required: true 
    },

    // Destination Location
    targetPlotId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plot' 
    },
    
    // Payment Tracking (For LGU transparency)
    officialReceiptNumber: String,
    feePaid: { type: Number, default: 0 },

    exhumationCompleted: {
        type: Date,
        default: null
    },

    transferCompleted: {
        type: Date,
        default: null
    },

    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected', 'completed'], 
        default: 'pending' 
    },
    
    approvedBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    },
    
    remarks: String,
    adminNotes: String,
}, { timestamps: true });

export default mongoose.model('Permit', permitSchema);