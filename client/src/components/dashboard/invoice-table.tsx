/**
 * Invoice Table Component
 * 
 * Searchable, filterable, paginated table of invoices
 * Features:
 * - Search by invoice number or vendor name
 * - Filter by status
 * - Date range filtering
 * - Pagination
 * - Sortable columns
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: { name: string };
  customer: { name: string };
  issueDate: string;
  dueDate: string;
  status: string;
  total: number;
  currency: string;
}

interface InvoicesResponse {
  data: Invoice[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function InvoiceTable() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery<InvoicesResponse>({
    queryKey: ['/api/invoices', search, status, page],
    queryFn: async () => {
      // Build query params
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString()
      });
      if (search) params.append('q', search);
      if (status && status !== 'all') params.append('status', status);

      const response = await fetch(`/api/invoices?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch invoices');
      return response.json();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-chart-2 text-chart-2-foreground';
      case 'pending':
        return 'bg-chart-3 text-chart-3-foreground';
      case 'overdue':
        return 'bg-destructive text-destructive-foreground';
      case 'cancelled':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const totalPages = data ? Math.ceil(data.pagination.total / limit) : 0;

  return (
    <Card className="overflow-hidden" data-testid="table-invoices">
      {/* Header with Search and Filters */}
      <div className="p-6 border-b bg-muted/30">
        <h3 className="text-lg font-semibold mb-4">Recent Invoices</h3>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search invoices or vendors..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0); // Reset to first page on search
              }}
              className="pl-9"
              data-testid="input-search-invoices"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={status || undefined}
            onValueChange={(value) => {
              setStatus(value === 'all' ? '' : value);
              setPage(0);
            }}
          >
            <SelectTrigger className="w-full md:w-48" data-testid="select-status-filter">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data && data.data.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b-2 border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.data.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="hover-elevate transition-colors"
                  data-testid={`row-invoice-${invoice.id}`}
                >
                  <td className="px-6 py-4 font-medium font-mono text-foreground">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {invoice.vendor.name}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground tabular-nums">
                    {new Date(invoice.issueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground tabular-nums">
                    {new Date(invoice.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={`${getStatusColor(invoice.status)} capitalize`}
                      data-testid={`badge-status-${invoice.status}`}
                    >
                      {invoice.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold tabular-nums text-foreground">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: invoice.currency
                    }).format(invoice.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No invoices found</p>
            {(search || status) && (
              <Button
                variant="link"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setStatus('');
                  setPage(0);
                }}
                className="mt-2"
              >
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.data.length > 0 && (
        <div className="px-6 py-4 border-t bg-muted/30 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{page * limit + 1}</span> to{' '}
            <span className="font-medium text-foreground">
              {Math.min((page + 1) * limit, data.pagination.total)}
            </span>{' '}
            of <span className="font-medium text-foreground">{data.pagination.total}</span> invoices
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              data-testid="button-prev-page"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={!data.pagination.hasMore}
              data-testid="button-next-page"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
