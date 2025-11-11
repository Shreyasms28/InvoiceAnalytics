/**
 * Invoice Trend Chart Component
 * 
 * Line chart showing invoice trends over time with dual y-axis:
 * - Left axis: Total invoice amount
 * - Right axis: Invoice count
 * 
 * Uses Chart.js with react-chartjs-2
 */

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import type { ChartOptions } from 'chart.js';
import { Skeleton } from '@/components/ui/skeleton';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface TrendData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    yAxisID: string;
  }>;
}

export default function InvoiceTrendChart() {
  const { data, isLoading } = useQuery<TrendData>({
    queryKey: ['/api/invoice-trends?basis=due']
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-80 w-full" />
      </Card>
    );
  }

  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Total Amount ($)',
        data: data?.datasets[0]?.data || [],
        borderColor: 'hsl(var(--chart-1))',
        backgroundColor: 'hsla(var(--chart-1), 0.1)',
        yAxisID: 'y-amount',
        tension: 0.4, // Curved line
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true
      },
      {
        label: 'Invoice Count',
        data: data?.datasets[1]?.data || [],
        borderColor: 'hsl(var(--chart-2))',
        backgroundColor: 'hsla(var(--chart-2), 0.1)',
        yAxisID: 'y-count',
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false, // Important: allows fixed height container
    interaction: {
      mode: 'index' as const,
      intersect: false
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        bodyFont: {
          family: 'Inter, system-ui, sans-serif'
        },
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          weight: 600
        }
      }
    },
    scales: {
      'y-amount': {
        type: 'linear' as const,
        position: 'left' as const,
        grid: {
          color: 'hsl(var(--border))',
        },
        border: {
          display: false
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
      'y-count': {
        type: 'linear' as const,
        position: 'right' as const,
        grid: {
          display: false
        },
        ticks: {
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
    <Card className="p-6" data-testid="chart-invoice-trends">
      <h3 className="text-lg font-semibold mb-4">Invoice Trends</h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  );
}
