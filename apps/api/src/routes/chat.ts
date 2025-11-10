/**
 * POST /api/chat-with-data
 * 
 * Proxies natural language queries to Vanna AI service
 * Vanna generates SQL from the query, validates it, executes it,
 * and returns both the SQL and results
 * 
 * Request body: { query: string }
 * Response: { sql: string, rows: any[] }
 */

import { Router } from 'express';
import axios from 'axios';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Get Vanna AI service URL from environment
    const vannaUrl = process.env.VANNA_AI_URL || 'http://localhost:8000';

    // Forward request to Vanna AI service
    const response = await axios.post(`${vannaUrl}/query`, {
      query
    }, {
      timeout: 30000 // 30 second timeout
    });

    // Return Vanna's response (contains sql and rows)
    res.json(response.data);
  } catch (error: any) {
    console.error('Error calling Vanna AI:', error.message);
    
    // Check if it's an axios error with response
    if (error.response) {
      const data = error.response.data;
      return res.status(error.response.status).json({
        error: 'Vanna AI service error',
        message: data?.detail || data?.error || data?.message || error.message
      });
    }

    // Network error or Vanna service unavailable
    res.status(503).json({
      error: 'Vanna AI service unavailable',
      message: 'Please ensure the Vanna service is running on port 8000'
    });
  }
});

export default router;
