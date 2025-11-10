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

import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Vanna AI URL: ${process.env.VANNA_AI_URL || 'http://localhost:8000'}`);
});
