/**
 * Overview Cards Component
 * 
 * Displays key metrics at the top of the dashboard:
 * - Total Spend YTD
 * - Total Invoices Processed
 * - Documents Uploaded
 * - Average Invoice Amount
 */

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { DollarSign, FileText, Upload, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatsData {
  totalSpendYTD: number;
  totalInvoices: number;
  documentsUploaded: number;
  avgInvoiceAmount: number;
}

export default function OverviewCards() {
  const { data: stats, isLoading } = useQuery<StatsData>({
    queryKey: ['/api/stats']
  });

  const cards = [
    {
      title: 'Total Spend YTD',
      value: stats?.totalSpendYTD || 0,
      format: 'currency',
      icon: DollarSign,
      color: 'text-chart-1',
      testId: 'card-total-spend'
    },
    {
      title: 'Total Invoices Processed',
      value: stats?.totalInvoices || 0,
      format: 'number',
      icon: FileText,
      color: 'text-chart-2',
      testId: 'card-total-invoices'
    },
    {
      title: 'Documents Uploaded',
      value: stats?.documentsUploaded || 0,
      format: 'number',
      icon: Upload,
      color: 'text-chart-3',
      testId: 'card-documents-uploaded'
    },
    {
      title: 'Avg Invoice Amount',
      value: stats?.avgInvoiceAmount || 0,
      format: 'currency',
      icon: TrendingUp,
      color: 'text-chart-4',
      testId: 'card-avg-invoice'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-10 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const formattedValue = card.format === 'currency'
          ? new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(card.value)
          : card.value.toLocaleString();

        return (
          <Card
            key={card.title}
            className="p-6 hover-elevate transition-all duration-200"
            data-testid={card.testId}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {card.title}
                </p>
              </div>
              <div className={`p-2 rounded-md bg-muted ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-bold tabular-nums tracking-tight" data-testid={`${card.testId}-value`}>
                {formattedValue}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
