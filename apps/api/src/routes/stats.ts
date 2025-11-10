/**
 * GET /api/stats
 * 
 * Returns overview statistics for the dashboard:
 * - Total spend year-to-date
 * - Total invoices processed
 * - Total documents uploaded
 * - Average invoice amount
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Calculate total spend YTD
    const ytdInvoices = await prisma.invoice.aggregate({
      where: {
        issueDate: {
          gte: yearStart
        },
        status: {
          not: 'cancelled'
        }
      },
      _sum: {
        total: true
      },
      _count: true,
      _avg: {
        total: true
      }
    });

    // Get total invoices count
    const totalInvoices = await prisma.invoice.count({
      where: {
        status: {
          not: 'cancelled'
        }
      }
    });

    // For "documents uploaded", we'll use total invoices as proxy
    // In a real system, this might track uploaded PDF files
    const documentsUploaded = totalInvoices;

    res.json({
      totalSpendYTD: ytdInvoices._sum.total || 0,
      totalInvoices: totalInvoices,
      documentsUploaded: documentsUploaded,
      avgInvoiceAmount: ytdInvoices._avg.total || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
