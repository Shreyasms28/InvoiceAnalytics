/**
 * GET /api/invoice-trends
 * 
 * Returns invoice trends over time for line chart visualization
 * Groups invoices by month, calculates total amount and count
 * Returns data for dual-axis chart (amount on left, count on right)
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    // Get invoices from the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: {
          gte: twelveMonthsAgo
        },
        status: {
          not: 'cancelled'
        }
      },
      select: {
        issueDate: true,
        total: true
      },
      orderBy: {
        issueDate: 'asc'
      }
    });

    // Group by month
    const monthlyData = new Map<string, { amount: number; count: number }>();

    invoices.forEach(invoice => {
      const monthKey = `${invoice.issueDate.getFullYear()}-${String(invoice.issueDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { amount: 0, count: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      data.amount += invoice.total;
      data.count += 1;
    });

    // Convert to array format for Chart.js
    const labels: string[] = [];
    const amounts: number[] = [];
    const counts: number[] = [];

    // Sort by date and format
    Array.from(monthlyData.keys()).sort().forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      
      const data = monthlyData.get(monthKey)!;
      amounts.push(Math.round(data.amount * 100) / 100);
      counts.push(data.count);
    });

    res.json({
      labels,
      datasets: [
        {
          label: 'Total Amount',
          data: amounts,
          yAxisID: 'y-amount'
        },
        {
          label: 'Invoice Count',
          data: counts,
          yAxisID: 'y-count'
        }
      ]
    });
  } catch (error) {
    console.error('Error fetching invoice trends:', error);
    res.status(500).json({ error: 'Failed to fetch invoice trends' });
  }
});

export default router;
