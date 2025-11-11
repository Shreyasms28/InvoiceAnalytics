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
    // Get invoices from the last 12 months (inclusive of current month)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setUTCMonth(twelveMonthsAgo.getUTCMonth() - 12);

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

    // Prepare zero-filled last 12 months using UTC to avoid TZ drift
    const monthlyData = new Map<string, { amount: number; count: number }>();
    const now = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      d.setUTCMonth(d.getUTCMonth() - i);
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      months.push(key);
      monthlyData.set(key, { amount: 0, count: 0 });
    }

    // Group invoices by UTC month
    invoices.forEach((invoice: { issueDate: Date; total: number }) => {
      const d = new Date(invoice.issueDate);
      const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      if (monthlyData.has(monthKey)) {
        const data = monthlyData.get(monthKey)!;
        data.amount += invoice.total;
        data.count += 1;
      }
    });

    // Convert to array format for Chart.js
    const labels: string[] = [];
    const amounts: number[] = [];
    const counts: number[] = [];

    // Keep predefined chronological order and format labels
    months.forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, 1));
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
