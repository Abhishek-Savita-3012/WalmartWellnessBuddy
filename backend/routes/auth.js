import express from 'express'; 
const router = express.Router();
import bcrypt from 'bcrypt'; 
import jwt from 'jsonwebtoken'; 
import User from '../models/User.js'; 

import { v4 as uuidv4 } from 'uuid'; 


const JWT_SECRET = "secret123"; 

// Signup route
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        userId: uuidv4(), 
        username: name,
        email,
        password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
});

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
        token,
        username: user.username, 
        email: user.email
    });
});
;
export default router; 
