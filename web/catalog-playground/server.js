const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = 5000;

// Configuration
const BANDO_API_BASE = 'https://api.bando.cool/api/v1';
const API_TOKEN = process.env.BANDO_API_TOKEN || null;

// Middleware
app.use(express.json());
app.use(express.static('dist')); // Serve built React app

// Cache implementation
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Rate limiting
const rateLimiter = {
  requests: new Map(),
  limit: API_TOKEN ? 100 : 10, // requests per minute
  
  canMakeRequest() {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const count = this.requests.get(minute) || 0;
    
    if (count >= this.limit) {
      return false;
    }
    
    this.requests.set(minute, count + 1);
    
    // Cleanup old entries
    for (const [key] of this.requests) {
      if (key < minute - 1) {
        this.requests.delete(key);
      }
    }
    
    return true;
  }
};

// API endpoint to fetch products
app.post('/api/products', async (req, res) => {
  try {
    // Check rate limit
    if (!rateLimiter.canMakeRequest()) {
      return res.status(429).json({
        message: 'Rate limit exceeded. Please wait before making more requests.',
        retryAfter: 60
      });
    }

    const { country, type, brand, pageSize, pageNumber } = req.body;
    
    // Build query parameters
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (type) params.append('type', type);
    if (brand) params.append('brand', brand);
    if (pageSize) params.append('pageSize', pageSize);
    if (pageNumber) params.append('pageNumber', pageNumber);
    
    const url = `${BANDO_API_BASE}/products/grouped/${params.toString() ? '?' + params.toString() : ''}`;
    
    // Check cache
    const cacheKey = url;
    const cachedData = cache.get(cacheKey);
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
      console.log('📦 Cache hit:', url);
      return res.json({
        products: cachedData.data.products || [],
        requestInfo: {
          url: url,
          cached: true,
          timestamp: cachedData.timestamp
        }
      });
    }

    // Configure request headers
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Bando-API-Playground/1.0'
    };

    if (API_TOKEN) {
      headers['Authorization'] = `Bearer ${API_TOKEN}`;
    }

    console.log('🔄 Making API request:', url);
    
    // Make API request
    const response = await axios.get(url, {
      headers,
      timeout: 30000
    });

    // Cache the response
    cache.set(cacheKey, {
      data: response.data,
      timestamp: Date.now()
    });

    res.json({
      products: response.data.products || [],
      requestInfo: {
        url: url,
        cached: false,
        timestamp: Date.now()
      }
    });

  } catch (error) {
    console.error('❌ API Error:', error.message);
    
    let statusCode = 500;
    let message = 'Internal server error';

    if (error.response) {
      statusCode = error.response.status;
      message = error.response.data?.message || `API returned ${statusCode} error`;
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      statusCode = 503;
      message = 'Unable to connect to Bando API';
    } else if (error.code === 'ETIMEDOUT') {
      statusCode = 504;
      message = 'Request timeout - API took too long to respond';
    }

    res.status(statusCode).json({
      message: message,
      error: error.response?.data || error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache_size: cache.size,
    rate_limit: {
      limit: rateLimiter.limit,
      authenticated: !!API_TOKEN
    }
  });
});

// Serve React app for all other routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/playground', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Bando API Playground server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api/products`);
  console.log(`🔑 Authentication: ${API_TOKEN ? 'Enabled' : 'Public mode'}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('👋 Shutting down server...');
  process.exit(0);
});