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
    // Build next 6 months (including current), oldest -> newest
    const months: Date[] = [];
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    for (let i = 0; i < 6; i++) {
      months.push(new Date(start.getFullYear(), start.getMonth() + i, 1));
    }

    const labels = months.map(d => d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));

    // Date range for query
    const rangeStart = months[0];
    const rangeEnd = new Date(months[months.length - 1].getFullYear(), months[months.length - 1].getMonth() + 1, 1);

    // Fetch invoices due in range, excluding cancelled
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { not: 'cancelled' },
        dueDate: { gte: rangeStart, lt: rangeEnd }
      },
      select: { id: true, total: true, dueDate: true }
    });

    // Map of total paid per invoice
    const invoiceIds = invoices.map(i => i.id);
    let paidByInvoice = new Map<string, number>();
    if (invoiceIds.length > 0) {
      const payments = await prisma.payment.findMany({
        where: { invoiceId: { in: invoiceIds } },
        select: { invoiceId: true, amount: true }
      });
      paidByInvoice = payments.reduce((map, p) => {
        map.set(p.invoiceId, (map.get(p.invoiceId) || 0) + Number(p.amount));
        return map;
      }, new Map<string, number>());
    }

    // Initialize buckets
    const totalsByKey: Record<string, number> = {};
    months.forEach(m => {
      totalsByKey[`${m.getFullYear()}-${m.getMonth()}`] = 0;
    });

    // Sum remaining amounts per due month
    invoices.forEach(inv => {
      const d = new Date(inv.dueDate as any);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const paid = paidByInvoice.get(inv.id) || 0;
      const remaining = Math.max(Number(inv.total) - paid, 0);
      if (key in totalsByKey) {
        totalsByKey[key] += remaining;
      }
    });

    const data = months.map(m => Math.round((totalsByKey[`${m.getFullYear()}-${m.getMonth()}`] || 0) * 100) / 100);

    res.json({ labels, data });
  } catch (error) {
    console.error('Error fetching cash outflow:', error);
    res.status(500).json({ error: 'Failed to fetch cash outflow data' });
  }
});

export default router;
