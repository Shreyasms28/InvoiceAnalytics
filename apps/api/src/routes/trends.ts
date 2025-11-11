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
    const basis = (String(req.query.basis || 'issue').toLowerCase() === 'due') ? 'dueDate' : 'issueDate';

    // Use Postgres to build a 12-month series and left join invoices by selected basis
    const rows: Array<{ label: string; amount: number; count: number }> = await prisma.$queryRawUnsafe(
      `
      WITH months AS (
        SELECT date_trunc('month', CURRENT_DATE) - (interval '1 month' * gs.a) AS month
        FROM generate_series(0, 11) AS gs(a)
      )
      SELECT to_char(m.month, 'Mon YYYY') AS label,
             COALESCE(SUM(i."total"), 0) AS amount,
             COUNT(i."id") AS count
      FROM months m
      LEFT JOIN "invoices" i
        ON date_trunc('month', i."${basis}") = m.month
       AND i."status" <> 'cancelled'
      GROUP BY m.month
      ORDER BY m.month;
      `
    );

    const labels = rows.map(r => r.label);
    const amounts = rows.map(r => Math.round(Number(r.amount) * 100) / 100);
    const counts = rows.map(r => Number(r.count));

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
