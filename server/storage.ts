/**
 * Storage Interface for Invoice Analytics
 * 
 * Implements data access layer using Drizzle ORM
 * This is based on the javascript_database blueprint pattern
 */

import { 
  invoices, 
  vendors,
  customers,
  categories,
  lineItems,
  payments,
  type Invoice,
  type Vendor,
  type Customer,
  type Category
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, sql, count, sum, avg } from "drizzle-orm";

// Storage interface defines all data operations
export interface IStorage {
  // Stats
  getStats(): Promise<{
    totalSpendYTD: number;
    totalInvoices: number;
    documentsUploaded: number;
    avgInvoiceAmount: number;
  }>;
  
  // Trends
  getInvoiceTrends(): Promise<{
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      yAxisID: string;
    }>;
  }>;
  
  // Vendors
  getTopVendors(limit: number): Promise<{
    labels: string[];
    data: number[];
  }>;
  
  // Categories
  getCategorySpend(): Promise<{
    labels: string[];
    data: number[];
  }>;
  
  // Cash flow
  getCashOutflow(): Promise<{
    labels: string[];
    data: number[];
  }>;
  
  // Invoices
  getInvoices(params: {
    search?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit: number;
    offset: number;
  }): Promise<{
    data: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }>;
}

export class DatabaseStorage implements IStorage {
  async getStats() {
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Get YTD totals
    const ytdResult = await db
      .select({
        total: sum(invoices.total),
        count: count(),
        avg: avg(invoices.total)
      })
      .from(invoices)
      .where(
        and(
          gte(invoices.issueDate, yearStart),
          sql`${invoices.status} != 'cancelled'`
        )
      );

    // Get total invoices count
    const totalResult = await db
      .select({ count: count() })
      .from(invoices)
      .where(sql`${invoices.status} != 'cancelled'`);

    const ytd = ytdResult[0];
    const total = totalResult[0];

    return {
      totalSpendYTD: Number(ytd.total) || 0,
      totalInvoices: total.count || 0,
      documentsUploaded: total.count || 0,
      avgInvoiceAmount: Number(ytd.avg) || 0
    };
  }

  async getInvoiceTrends() {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const results = await db
      .select({
        issueDate: invoices.issueDate,
        total: invoices.total
      })
      .from(invoices)
      .where(
        and(
          gte(invoices.issueDate, twelveMonthsAgo),
          sql`${invoices.status} != 'cancelled'`
        )
      )
      .orderBy(invoices.issueDate);

    // Group by month
    const monthlyData = new Map<string, { amount: number; count: number }>();

    results.forEach(invoice => {
      const date = new Date(invoice.issueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { amount: 0, count: 0 });
      }
      
      const data = monthlyData.get(monthKey)!;
      data.amount += invoice.total;
      data.count += 1;
    });

    // Convert to arrays
    const labels: string[] = [];
    const amounts: number[] = [];
    const counts: number[] = [];

    Array.from(monthlyData.keys()).sort().forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      
      const data = monthlyData.get(monthKey)!;
      amounts.push(Math.round(data.amount * 100) / 100);
      counts.push(data.count);
    });

    return {
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
    };
  }

  async getTopVendors(limit = 10) {
    const results = await db
      .select({
        vendorId: invoices.vendorId,
        vendorName: vendors.name,
        total: sum(invoices.total)
      })
      .from(invoices)
      .innerJoin(vendors, eq(invoices.vendorId, vendors.id))
      .where(sql`${invoices.status} != 'cancelled'`)
      .groupBy(invoices.vendorId, vendors.name)
      .orderBy(desc(sum(invoices.total)))
      .limit(limit);

    return {
      labels: results.map(r => r.vendorName),
      data: results.map(r => Math.round(Number(r.total) * 100) / 100)
    };
  }

  async getCategorySpend() {
    const results = await db
      .select({
        categoryName: categories.name,
        total: sum(lineItems.amount)
      })
      .from(lineItems)
      .leftJoin(categories, eq(lineItems.categoryId, categories.id))
      .groupBy(categories.name)
      .orderBy(desc(sum(lineItems.amount)));

    return {
      labels: results.map(r => r.categoryName || 'Uncategorized'),
      data: results.map(r => Math.round(Number(r.total) * 100) / 100)
    };
  }

  async getCashOutflow() {
    const today = new Date();
    const sixMonthsLater = new Date();
    sixMonthsLater.setMonth(today.getMonth() + 6);

    const results = await db
      .select({
        dueDate: invoices.dueDate,
        total: invoices.total
      })
      .from(invoices)
      .where(
        and(
          gte(invoices.dueDate, today),
          lte(invoices.dueDate, sixMonthsLater),
          sql`${invoices.status} IN ('pending', 'overdue')`
        )
      );

    // Group by month
    const monthlyOutflow = new Map<string, number>();

    results.forEach(invoice => {
      const date = new Date(invoice.dueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyOutflow.set(
        monthKey,
        (monthlyOutflow.get(monthKey) || 0) + invoice.total
      );
    });

    // Convert to arrays
    const labels: string[] = [];
    const data: number[] = [];

    Array.from(monthlyOutflow.keys()).sort().forEach(monthKey => {
      const [year, month] = monthKey.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
      data.push(Math.round(monthlyOutflow.get(monthKey)! * 100) / 100);
    });

    return { labels, data };
  }

  async getInvoices(params: {
    search?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    limit: number;
    offset: number;
  }) {
    // Build where conditions
    const conditions = [];
    
    if (params.search) {
      conditions.push(
        sql`${invoices.invoiceNumber} ILIKE ${`%${params.search}%`} OR ${vendors.name} ILIKE ${`%${params.search}%`}`
      );
    }
    
    if (params.status) {
      conditions.push(eq(invoices.status, params.status));
    }
    
    if (params.dateFrom) {
      conditions.push(gte(invoices.issueDate, params.dateFrom));
    }
    
    if (params.dateTo) {
      conditions.push(lte(invoices.issueDate, params.dateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const countResult = await db
      .select({ count: count() })
      .from(invoices)
      .innerJoin(vendors, eq(invoices.vendorId, vendors.id))
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(whereClause);

    const total = countResult[0].count;

    // Get paginated results
    const results = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        vendorName: vendors.name,
        customerName: customers.name,
        issueDate: invoices.issueDate,
        dueDate: invoices.dueDate,
        status: invoices.status,
        total: invoices.total,
        currency: invoices.currency
      })
      .from(invoices)
      .innerJoin(vendors, eq(invoices.vendorId, vendors.id))
      .innerJoin(customers, eq(invoices.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(invoices.issueDate))
      .limit(params.limit)
      .offset(params.offset);

    return {
      data: results.map(r => ({
        id: r.id,
        invoiceNumber: r.invoiceNumber,
        vendor: { name: r.vendorName },
        customer: { name: r.customerName },
        issueDate: r.issueDate.toISOString(),
        dueDate: r.dueDate.toISOString(),
        status: r.status,
        total: r.total,
        currency: r.currency
      })),
      pagination: {
        total,
        limit: params.limit,
        offset: params.offset,
        hasMore: params.offset + results.length < total
      }
    };
  }
}

export const storage = new DatabaseStorage();
