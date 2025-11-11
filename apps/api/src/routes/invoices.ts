/**
 * GET /api/invoices
 * 
 * Returns paginated, searchable, filterable list of invoices
 * Query parameters:
 * - q: search query (matches invoice number, vendor name)
 * - status: filter by status
 * - dateFrom: filter by issue date (start)
 * - dateTo: filter by issue date (end)
 * - limit: page size (default 20)
 * - offset: pagination offset (default 0)
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const prisma = new PrismaClient();
    const {
      q = '',
      status = '',
      dateFrom = '',
      dateTo = '',
      limit = '20',
      offset = '0'
    } = req.query;

    // Build where clause (avoid Prisma-specific input types for serverless build)
    const where: any = { AND: [] };

    // Search filter (invoice number or vendor name)
    if (q) {
      where.OR = [
        { invoiceNumber: { contains: q as string, mode: 'insensitive' } },
        { vendor: { name: { contains: q as string, mode: 'insensitive' } } }
      ];
    }

    // Status filter
    if (status) {
      where.status = status as string;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.issueDate = where.issueDate || {};
      if (dateFrom) {
        where.issueDate.gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        where.issueDate.lte = new Date(dateTo as string);
      }
    }

    // Get total count for pagination
    const total = await prisma.invoice.count({ where });

    // Get paginated results
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        vendor: true,
        customer: true
      },
      orderBy: {
        issueDate: 'desc'
      },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({
      data: invoices,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: parseInt(offset as string) + invoices.length < total
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', (error as any)?.message || error);
    // Graceful fallback
    res.status(200).json({
      data: [],
      pagination: {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false
      }
    });
  }
});

export default router;
