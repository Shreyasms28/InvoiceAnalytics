/**
 * Cash Outflow Chart Component
 * 
 * Vertical bar chart showing projected cash outflow by month
 * Based on upcoming invoice due dates
 */

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import { Skeleton } from '@/components/ui/skeleton';

interface CashflowData {
  labels: string[];
  data: number[];
}

export default function CashOutflowChart() {
  const { data, isLoading } = useQuery<CashflowData>({
    queryKey: ['/api/cash-outflow']
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    );
  }

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Projected Outflow',
        data: data?.data || [],
        backgroundColor: 'hsl(var(--chart-3))',
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => `Amount: $${context.parsed.y.toLocaleString()}`
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif'
        },
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          weight: '600'
        }
      }
    },
    scales: {
      y: {
        grid: {
          color: 'hsl(var(--border))',
          drawBorder: false
        },
        ticks: {
          callback: (value: any) => '$' + value.toLocaleString(),
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          },
          color: 'hsl(var(--muted-foreground))'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11
          },
          color: 'hsl(var(--muted-foreground))'
        }
      }
    }
  };

  return (
    <Card className="p-6" data-testid="chart-cash-outflow">
      <h3 className="text-lg font-semibold mb-4">Projected Cash Outflow</h3>
      <div className="h-64">
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}
