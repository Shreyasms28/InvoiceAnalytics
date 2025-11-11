/**
 * GET /api/cash-outflow
 * 
 * Returns projected cash outflow by month
 * Based on invoice due dates and pending payments
 * Used for bar chart visualization
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_req, res) => {
  try {
    // Next 6 months (including current), due-based, pending/overdue only
    const rows: Array<{ label: string; total: number }> = await prisma.$queryRawUnsafe(
      `
      WITH months AS (
        SELECT date_trunc('month', CURRENT_DATE) + (interval '1 month' * gs.a) AS month
        FROM generate_series(0, 5) AS gs(a)
      )
      SELECT to_char(m.month, 'Mon YYYY') AS label,
             COALESCE(SUM(i."total" - COALESCE(paid.paid_amount, 0)), 0) AS total
      FROM months m
      LEFT JOIN "invoices" i
        ON date_trunc('month', i."dueDate") = m.month
       AND i."status" <> 'cancelled'
      LEFT JOIN (
        SELECT "invoiceId", COALESCE(SUM("amount"),0) AS paid_amount
        FROM "payments"
        GROUP BY "invoiceId"
      ) paid ON paid."invoiceId" = i."id"
      GROUP BY m.month
      ORDER BY m.month;
      `
    );

    const labels = rows.map(r => r.label);
    const data = rows.map(r => Math.round(Number(r.total) * 100) / 100);

    res.json({ labels, data });
  } catch (error) {
    console.error('Error fetching cash outflow:', error);
    res.status(500).json({ error: 'Failed to fetch cash outflow data' });
  }
});

export default router;
