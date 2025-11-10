/**
 * Dashboard Page - Main analytics view
 * 
 * Features:
 * - Overview cards showing key metrics (Total Spend YTD, Total Invoices, Documents, Avg Invoice)
 * - Invoice trends line chart with dual y-axis
 * - Top 10 vendors horizontal bar chart
 * - Category spending pie chart
 * - Cash outflow projection bar chart
 * - Searchable, filterable, paginated invoices table
 */

import { useQuery } from '@tanstack/react-query';
import OverviewCards from '@/components/dashboard/overview-cards';
import InvoiceTrendChart from '@/components/dashboard/invoice-trend-chart';
import VendorBarChart from '@/components/dashboard/vendor-bar-chart';
import CategoryPieChart from '@/components/dashboard/category-pie-chart';
import CashOutflowChart from '@/components/dashboard/cash-outflow-chart';
import InvoiceTable from '@/components/dashboard/invoice-table';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Invoice Analytics Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Track spending, analyze trends, and manage invoices
          </p>
        </div>

        {/* Overview Cards */}
        <OverviewCards />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoiceTrendChart />
          <VendorBarChart />
          <CategoryPieChart />
          <CashOutflowChart />
        </div>

        {/* Invoices Table */}
        <InvoiceTable />
      </div>
    </div>
  );
}
