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
    // basis can be 'issue' (default) or 'due'
    const basisKey = (String(req.query.basis || 'issue').toLowerCase() === 'due') ? 'dueDate' : 'issueDate';

    // Compute last 12 months labels (oldest to newest)
    const months: Date[] = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 11; i >= 0; i--) {
      months.push(new Date(start.getFullYear(), start.getMonth() - i, 1));
    }

    const labels = months.map(d => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

    // Fetch invoices for the period (exclude cancelled)
    const fromDate = new Date(months[0].getFullYear(), months[0].getMonth(), 1);
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { not: 'cancelled' },
        [basisKey]: { gte: fromDate }
      },
      select: { id: true, total: true, issueDate: true, dueDate: true }
    });

    // Group by month key
    const sums: Record<string, { amount: number; count: number }> = {};
    months.forEach((d) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      sums[key] = { amount: 0, count: 0 };
    });

    invoices.forEach((inv) => {
      const d = basisKey === 'dueDate' ? new Date(inv.dueDate as any) : new Date(inv.issueDate as any);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (sums[key]) {
        sums[key].amount += Number(inv.total);
        sums[key].count += 1;
      }
    });

    const amounts = months.map(d => Math.round((sums[`${d.getFullYear()}-${d.getMonth()}`].amount) * 100) / 100);
    const counts = months.map(d => sums[`${d.getFullYear()}-${d.getMonth()}`].count);

    res.json({
      labels,
      datasets: [
        { label: 'Total Amount', data: amounts, yAxisID: 'y-amount' },
        { label: 'Invoice Count', data: counts, yAxisID: 'y-count' }
      ]
    });
  } catch (error) {
    console.error('Error fetching invoice trends:', error);
    res.status(500).json({ error: 'Failed to fetch invoice trends' });
  }
});

export default router;
