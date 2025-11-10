/**
 * API Routes for Invoice Analytics
 * 
 * Implements all endpoints:
 * - GET /api/stats - Overview statistics
 * - GET /api/invoice-trends - Monthly trends
 * - GET /api/vendors/top10 - Top vendors by spend
 * - GET /api/category-spend - Category breakdown
 * - GET /api/cash-outflow - Projected cash flow
 * - GET /api/invoices - Searchable invoice list
 * - POST /api/chat-with-data - Proxy to Vanna AI
 */

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  // GET /api/stats - Overview statistics
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  // GET /api/invoice-trends - Monthly trends data
  app.get("/api/invoice-trends", async (req, res) => {
    try {
      const trends = await storage.getInvoiceTrends();
      res.json(trends);
    } catch (error: any) {
      console.error('Error fetching invoice trends:', error);
      res.status(500).json({ error: 'Failed to fetch invoice trends' });
    }
  });

  // GET /api/vendors/top10 - Top 10 vendors by spend
  app.get("/api/vendors/top10", async (req, res) => {
    try {
      const vendors = await storage.getTopVendors(10);
      res.json(vendors);
    } catch (error: any) {
      console.error('Error fetching top vendors:', error);
      res.status(500).json({ error: 'Failed to fetch top vendors' });
    }
  });

  // GET /api/category-spend - Category spending breakdown
  app.get("/api/category-spend", async (req, res) => {
    try {
      const categories = await storage.getCategorySpend();
      res.json(categories);
    } catch (error: any) {
      console.error('Error fetching category spend:', error);
      res.status(500).json({ error: 'Failed to fetch category spending' });
    }
  });

  // GET /api/cash-outflow - Projected cash outflow
  app.get("/api/cash-outflow", async (req, res) => {
    try {
      const cashflow = await storage.getCashOutflow();
      res.json(cashflow);
    } catch (error: any) {
      console.error('Error fetching cash outflow:', error);
      res.status(500).json({ error: 'Failed to fetch cash outflow data' });
    }
  });

  // GET /api/invoices - Searchable, filterable invoice list
  app.get("/api/invoices", async (req, res) => {
    try {
      const {
        q = '',
        status = '',
        dateFrom = '',
        dateTo = '',
        limit = '20',
        offset = '0'
      } = req.query;

      const params = {
        search: q as string,
        status: status as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const result = await storage.getInvoices(params);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  // POST /api/chat-with-data - Proxy to Vanna AI service
  app.post("/api/chat-with-data", async (req, res) => {
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
        return res.status(error.response.status).json({
          error: 'Vanna AI service error',
          message: error.response.data?.error || error.message
        });
      }

      // Network error or Vanna service unavailable
      res.status(503).json({
        error: 'Vanna AI service unavailable',
        message: 'Please ensure the Vanna service is running on port 8000'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
