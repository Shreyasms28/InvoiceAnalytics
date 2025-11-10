/**
 * Express API Server for QualityAnalytics
 * 
 * Serves RESTful endpoints for invoice analytics:
 * - Statistics and overview data
 * - Invoice trends over time
 * - Vendor and category analytics
 * - Cash outflow projections
 * - Invoice search and filtering
 * - Proxy to Vanna AI for natural language SQL queries
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import statsRouter from './routes/stats';
import invoicesRouter from './routes/invoices';
import trendsRouter from './routes/trends';
import vendorsRouter from './routes/vendors';
import categoriesRouter from './routes/categories';
import cashflowRouter from './routes/cashflow';
import chatRouter from './routes/chat';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors()); // Enable CORS for all routes (frontend will call from different port)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes - all prefixed with /api
app.use('/api/stats', statsRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/invoice-trends', trendsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/category-spend', categoriesRouter);
app.use('/api/cash-outflow', cashflowRouter);
app.use('/api/chat-with-data', chatRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Vanna AI URL: ${process.env.VANNA_AI_URL || 'http://localhost:8000'}`);
});
