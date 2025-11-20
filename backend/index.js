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
  generalLimiter,
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

// Rate limiting - Apply before other middleware
app.use('/api', generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB injection protection - Apply before routes
app.use(mongoSanitizeConfig);

// HTTP Parameter Pollution protection
app.use(hppConfig);

// Cookie parser
app.use(cookieParser());

// Static files
app.use(express.static('public'));

// CORS configuration
const corsOptions = {
  origin: process.env.CLIENT_URL, // e.g., 'https://your-frontend.com'
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};
app.use(cors(corsOptions));

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
app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`Server is running on port ${PORT}`);
});
