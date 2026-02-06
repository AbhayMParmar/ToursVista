const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

const app = express();

// Debug logging
console.log('🔧 Environment Check:', {
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET_SET: !!process.env.JWT_SECRET,
  MONGODB_URI_SET: !!process.env.MONGODB_URI,
  PORT: process.env.PORT
});

// Middleware - Simplified CORS for now
app.use(cors({
  origin: '*', // Allow all origins for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Database Connection with better error handling
const connectDB = async () => {
  try {
    const atlasURI = process.env.MONGODB_URI;
    
    if (!atlasURI) {
      console.error('❌ ERROR: MONGODB_URI is not set in environment variables');
      console.log('⚠️  Please set MONGODB_URI in Render environment variables');
      console.log('📚 Format: mongodb+srv://username:password@cluster.mongodb.net/database');
      return false;
    }
    
    console.log('🔗 Attempting MongoDB connection...');
    
    await mongoose.connect(atlasURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Atlas connected successfully!');
    
    // Initialize default data
    await initializeDefaultData();
    
    return true;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('⚠️  Please check your MONGODB_URI in Render environment variables');
    console.log('💡 Tip: Make sure your IP is whitelisted in MongoDB Atlas');
    return false;
  }
};

// Initialize default data
const initializeDefaultData = async () => {
  try {
    const User = require('./models/User');
    const Tour = require('./models/Tour');
    
    // Check if admin user exists
    const adminExists = await User.findOne({ email: 'admin@tourvista.com' });
    if (!adminExists) {
      console.log('👤 Creating admin user...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      
      const adminUser = new User({
        name: 'Administrator',
        email: 'admin@tourvista.com',
        phone: '+91 9876543210',
        password: hashedPassword,
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('✅ Admin user created: admin@tourvista.com / Admin@123');
    } else {
      console.log('✅ Admin user already exists');
    }
    
    // Check if default tours exist
    const tourCount = await Tour.countDocuments();
    if (tourCount === 0) {
      console.log('🏞️ Creating default tours...');
      const defaultTours = [
        {
          title: 'Taj Mahal & Golden Triangle',
          description: 'Experience the iconic Taj Mahal and explore Delhi, Agra, and Jaipur.',
          price: 24999,
          duration: '7 days',
          images: ['https://images.unsplash.com/photo-1564507592333-c60657eea523'],
          region: 'north',
          category: 'heritage',
          destination: 'North India',
          isActive: true
        },
        {
          title: 'Kerala Backwaters & Beaches',
          description: 'Houseboat experience through serene backwaters and beautiful beaches.',
          price: 18999,
          duration: '8 days',
          images: ['https://tse4.mm.bing.net/th/id/OIP.J5VQPA5KVcTKfxc3f1441QHaEK'],
          region: 'south',
          category: 'beach',
          destination: 'South India',
          isActive: true
        }
      ];
      
      await Tour.insertMany(defaultTours);
      console.log('✅ Default tours created');
    } else {
      console.log(`✅ ${tourCount} tours already exist`);
    }
  } catch (error) {
    console.error('⚠️ Error initializing default data:', error.message);
  }
};

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    const status = dbStatus === 'connected' ? 200 : 503;
    
    res.status(status).json({
      success: dbStatus === 'connected',
      status: dbStatus === 'connected' ? 'healthy' : 'unhealthy',
      message: `Server is ${dbStatus === 'connected' ? 'running' : 'having database issues'}`,
      database: dbStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      jwtSecretConfigured: !!process.env.JWT_SECRET
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Test endpoint for debugging
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET_SET: !!process.env.JWT_SECRET,
      MONGODB_URI_SET: !!process.env.MONGODB_URI,
      PORT: process.env.PORT
    },
    database: {
      state: mongoose.connection.readyState,
      stateText: mongoose.connection.readyState === 1 ? 'connected' : 
                 mongoose.connection.readyState === 2 ? 'connecting' :
                 mongoose.connection.readyState === 3 ? 'disconnecting' : 'disconnected'
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage()
    }
  });
});

// Simple test login endpoint
app.post('/api/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (email === 'test@test.com' && password === 'test123') {
      // Simple test token without JWT_SECRET dependency
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { test: true, email },
        process.env.JWT_SECRET || 'test-fallback-secret',
        { expiresIn: '1h' }
      );
      
      return res.json({
        success: true,
        message: 'Test login successful',
        token,
        user: { email, name: 'Test User' }
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid test credentials'
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint error',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'TourVista India Backend API',
    status: 'running',
    deployed: true,
    endpoints: {
      auth: '/api/auth',
      tours: '/api/tours',
      bookings: '/api/bookings',
      admin: '/api/admin',
      health: '/api/health',
      debug: '/api/debug',
      testLogin: '/api/test-login'
    },
    docs: `${req.protocol}://${req.get('host')}/api/health`
  });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const tourRoutes = require('./routes/tourRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const savedRoutes = require('./routes/savedRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/tours', tourRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/saved', savedRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    requestedUrl: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Global Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  console.log('🚀 Starting TourVista server...');
  
  // Connect to database
  const dbConnected = await connectDB();
  
  if (!dbConnected && process.env.NODE_ENV === 'production') {
    console.error('❌ Fatal: Database connection failed in production');
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`🌐 Health Check: ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/api/health`);
    console.log(`🔑 JWT Secret configured: ${!!process.env.JWT_SECRET}`);
    console.log(`📊 Database connected: ${dbConnected ? 'Yes' : 'No'}`);
  });
};

startServer();
