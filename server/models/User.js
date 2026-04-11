import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },

  role: {
    type: String,
    enum: ['admin', 'staff', 'public'],
    default: 'public'
  },
  contactNumber: String
}, { timestamps: true });

export  default mongoose.model('User', userSchema);