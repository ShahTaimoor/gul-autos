const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoute = require('./routes/categoryRoutes')
const mediaRoutes = require('./routes/mediaRoutes');
const cookieParser = require('cookie-parser')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const cartRoutes = require('./routes/cartRoutes');

// Security middleware
const {
  helmetConfig,
  mongoSanitizeConfig,
  hppConfig,
  compressionConfig
} = require('./middleware/security');

// Logging middleware
const { morganMiddleware, httpLogger } = require('./middleware/morganLogger');
const logger = require('./utils/logger');

dotenv.config();

const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware - Apply early
app.use(helmetConfig);
app.use(compressionConfig);

// Rate limiting is applied only to login endpoints (see userRoutes.js)
// Removed global rate limiting to allow unrestricted access to other routes

// Body parsing middleware with increased limits for slow networks
app.use(express.json({ 
    limit: '10mb'
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb',
    parameterLimit: 10000
}));

// MongoDB injection protection - Apply before routes
app.use(mongoSanitizeConfig);

// HTTP Parameter Pollution protection
app.use(hppConfig);

// Cookie parser
app.use(cookieParser());

// Static files
app.use(express.static('public'));

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://gultraders.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  // Add any other allowed origins here
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log the blocked origin for debugging
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};
app.use(cors(corsOptions));

// Request timeout middleware for slow networks
app.use((req, res, next) => {
  // Set request timeout to 2 minutes (120 seconds) for slow internet connections
  req.setTimeout(120000, () => {
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout - please check your internet connection and try again'
      });
    }
  });
  next();
});

// Logging middleware - Apply after security but before routes
if (process.env.NODE_ENV === 'production') {
  app.use(morganMiddleware); // JSON format for production
} else {
  app.use(httpLogger); // Human-readable format for development
}
// Connect to Database
connectDB().catch((err) => {
  logger.error('Database connection error:', err);
  process.exit(1);
});

// API Routes
app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', orderRoutes);
app.use('/api', categoryRoute);
app.use('/api', mediaRoutes);
app.use('/api', cartRoutes);


// Test Route
app.get('/', (req, res) => {
    res.send('Welcome to Zaryab Auto API');
});

// Global error handling
app.use(notFound)
app.use(errorHandler)

// Start the server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Configure server timeouts for slow networks
server.timeout = 120000; // 120 seconds (2 minutes) - increased for slow internet connections
server.keepAliveTimeout = 65000; // 65 seconds - must be greater than client timeout
server.headersTimeout = 66000; // 66 seconds - must be greater than keepAliveTimeout

// Handle server errors
server.on('error', (error) => {
    logger.error('Server error:', { error: error.message, stack: error.stack });
});

// Handle timeout errors
server.on('timeout', (socket) => {
    logger.warn('Server timeout - client connection timed out');
    socket.destroy();
});
