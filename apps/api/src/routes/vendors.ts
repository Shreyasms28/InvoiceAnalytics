/**
 * GET /api/vendors/top10
 * 
 * Returns top 10 vendors by total spend
 * Used for horizontal bar chart visualization
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/top10', async (req, res) => {
  try {
    // Get all invoices with vendor information
    const invoices = await prisma.invoice.findMany({
      where: {
        status: {
          not: 'cancelled'
        }
      },
      include: {
        vendor: true
      }
    });

    // Aggregate by vendor
    const vendorTotals = new Map<string, { name: string; total: number }>();

    invoices.forEach((invoice: { vendorId: string; vendor: { name: string }; total: number }) => {
      const vendorId = invoice.vendorId;
      if (!vendorTotals.has(vendorId)) {
        vendorTotals.set(vendorId, {
          name: invoice.vendor.name,
          total: 0
        });
      }
      vendorTotals.get(vendorId)!.total += invoice.total;
    });

    // Sort by total and take top 10
    const top10 = Array.from(vendorTotals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    res.json({
      labels: top10.map(v => v.name),
      data: top10.map(v => Math.round(v.total * 100) / 100)
    });
  } catch (error) {
    console.error('Error fetching top vendors:', error);
    res.status(500).json({ error: 'Failed to fetch top vendors' });
  }
});

export default router;
