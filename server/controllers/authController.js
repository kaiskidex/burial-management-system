import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

//Register with secret code (for identifying role access)
const register = async (req, res) => {
  try {
    const { name, email, password, contactNumber, secretCode } = req.body;
    
    //Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    //Determine role based on secret code
    let userRole = 'public'; //default role
    let roleAssignedBy = null;

    if (secretCode) {
      if (secretCode === process.env.ADMIN_SECRET_CODE) {
        userRole = 'admin';
        roleAssignedBy = 'admin_secret_code';
      } else if (secretCode === process.env.STAFF_SECRET_CODE) {
        userRole = 'staff';
        roleAssignedBy = 'staff_secret_code';
      } else {
        return res.status(400).json({ message: 'Invalid secret code'});
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    //Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: userRole,
      contactNumber,
      roleAssignedBy,
      registeredAt: new Date()
    });
    
    res.status(201).json({
      success: true,
      message: userRole === 'public'
        ? 'Registration successful! You have registered as a public user.'
        : `Registration successful! You have been registered as ${userRole}.`,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const updateUserRole = async (req, res) => {
    try {
        // Check if requester is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }
        
        const { userId, role } = req.body;
        
        if (!['admin', 'staff', 'public'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: `User role updated to ${role}`, user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { register, login, getMe, getAllUsers, updateUserRole };