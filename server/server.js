const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { initializeDatabase } = require('./config/database');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Increased limit for images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database connection
    await initializeDatabase();
    console.log('✅ Database connected successfully');

    // Routes
    app.use('/api', apiRoutes);

    // Health check
    app.get('/health', (req, res) => {
      res.json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message
      });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API endpoints available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();


// import express from 'express'
// import cors from 'cors'


// const app = express()
// app.use(cors())
// const PORT = 5000
// app.get('/', (req, res)=>{
//     res.send("<h1>This is Server</h1>")
// })

// app.listen(PORT, ()=>{
//     console.log(`Server running at http://localhost:${PORT}`)
// })