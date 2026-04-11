import mongoose from 'mongoose';

const BurialSchema = new mongoose.Schema({
    // Deceased Information
    deceasedName: { 
        type: String, 
        required: [true, 'Deceased name is required'] 
    },
    dateOfBirth: { 
        type: Date,
        required: [true, 'Date of birth is required'] 
    },
    dateOfDeath: { 
        type: Date, 
        required: [true, 'Date of death is required'] 
    },
    dateOfInterment: { 
        type: Date 
    },

    // Plot Reference
    plotId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plot',
        required: [true, 'A burial must be assigned to a plot']
    },

    // Document References
    permitId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Permit'
    },
    
    // Status 
    status: { 
        type: String, 
        enum: ['occupied', 'available', 'reserved', 'exhumed'], 
        default: 'occupied' 
    }
}, { 
    timestamps: true 
});

export default mongoose.model('Burial', BurialSchema);