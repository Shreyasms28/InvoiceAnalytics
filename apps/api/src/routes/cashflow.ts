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

router.get('/', async (req, res) => {
  try {
    // Get next 6 months of invoices
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(today.getMonth() + 6);

    const invoices = await prisma.invoice.findMany({
      where: {
        dueDate: {
          gte: today,
          lte: sixMonthsLater
        },
        status: {
          in: ['pending', 'overdue']
        }
      },
      select: {
        dueDate: true,
        total: true
      }
    });

    // Group by month
    const monthlyOutflow = new Map<string, number>();

    invoices.forEach(invoice => {
      const monthKey = `${invoice.dueDate.getFullYear()}-${String(invoice.dueDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyOutflow.set(
        monthKey,
        (monthlyOutflow.get(monthKey) || 0) + invoice.total
      );
    });

    // Convert to array format
    const labels: string[] = [];
    const data: number[] = [];

    Array.from(monthlyOutflow.keys()).sort().forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      data.push(Math.round(monthlyOutflow.get(monthKey)! * 100) / 100);
    });

    res.json({ labels, data });
  } catch (error) {
    console.error('Error fetching cash outflow:', error);
    res.status(500).json({ error: 'Failed to fetch cash outflow data' });
  }
});

export default router;
