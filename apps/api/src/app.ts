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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
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
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err?.message || 'Unknown error'
  });
});

export default app;
