const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoute = require('./routes/categoryRoutes')
const cookirParser = require('cookie-parser')
const cartRoutes = require('./routes/cartRoutes');
dotenv.config();

const app = express();

app.use(express.static('public'));
// Middleware
const corsOptions = {
  origin: process.env.CLIENT_URL, // e.g., 'https://your-frontend.com'
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookirParser())
// Connect to Database
connectDB();

// API Routes
app.use('/api', userRoutes);
app.use('/api', productRoutes);
app.use('/api', orderRoutes);
app.use('/api', categoryRoute);
app.use('/api', cartRoutes);


// Test Route
app.get('/', (req, res) => {
    res.send('Welcome to Zaryab Auto API');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
