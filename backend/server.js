import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import generateChatResponse from './routes/chatAi.js'; 
import authRoutes from './routes/auth.js';
import mealSearchRoute from './routes/mealSearch.js'; 
import dotenv from 'dotenv';
dotenv.config(); 

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/dietchatbot')
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

app.use('/api/auth', authRoutes);

app.post('/api/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    const ingredients = await generateChatResponse(prompt);
    res.json({ reply: ingredients }); 
  } catch (error) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: 'Internal error occurred while generating AI response.' });
  }
});

app.use('/api/meals', mealSearchRoute);

const PORT = process.env.PORT; 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
