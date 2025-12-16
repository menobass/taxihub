require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const communityRoutes = require('./routes/community.routes');
const authRoutes = require('./routes/auth.routes');
const hubRoutes = require('./routes/hub.routes');
const hubMiddleware = require('./middleware/hub.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://images.hive.blog", "https://images.ecency.com"],
      connectSrc: ["'self'", "https://api.hive.blog", "https://api.openhive.network"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || '*'
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static('public'));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/hubs', hubRoutes);  // Hub registry (no hub context needed)
app.use('/api', hubMiddleware, communityRoutes);  // Community routes (require hub context)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'TaxiHub Community Management Portal' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚕 TaxiHub server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🏢 Multi-hub mode enabled`);
  console.log(`� Default hub: ${process.env.DEFAULT_HUB_SLUG || 'demo-hub'}`);
});

module.exports = app;
