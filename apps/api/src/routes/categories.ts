/**
 * GET /api/category-spend
 * 
 * Returns spending breakdown by category
 * Used for pie chart visualization
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const prisma = new PrismaClient();
    // Get all line items with category information
    const lineItems = await prisma.lineItem.findMany({
      include: {
        category: true
      }
    });

    // Aggregate by category
    const categoryTotals = new Map<string, number>();

    lineItems.forEach((item: { category: { name: string } | null; amount: number }) => {
      const categoryName = item.category?.name || 'Uncategorized';
      categoryTotals.set(
        categoryName,
        (categoryTotals.get(categoryName) || 0) + item.amount
      );
    });

    // Convert to array format
    const categories = Array.from(categoryTotals.entries())
      .map(([name, total]) => ({
        name,
        total: Math.round(total * 100) / 100
      }))
      .sort((a, b) => b.total - a.total);

    res.json({
      labels: categories.map(c => c.name),
      data: categories.map(c => c.total)
    });
  } catch (error) {
    console.error('Error fetching category spend:', (error as any)?.message || error);
    // Graceful fallback
    res.status(200).json({ labels: [], data: [] });
  }
});

export default router;
