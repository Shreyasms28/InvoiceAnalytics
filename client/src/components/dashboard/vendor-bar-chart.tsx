/**
 * Vendor Bar Chart Component
 * 
 * Horizontal bar chart showing top 10 vendors by total spend
 */

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Skeleton } from '@/components/ui/skeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface VendorData {
  labels: string[];
  data: number[];
}

export default function VendorBarChart() {
  const { data, isLoading } = useQuery<VendorData>({
    queryKey: ['/api/vendors/top10']
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
        label: 'Total Spend',
        data: data?.data || [],
        backgroundColor: 'hsl(var(--chart-1))',
        borderRadius: 4,
        barThickness: 24
      }
    ]
  };

  const options = {
    indexAxis: 'y' as const, // Horizontal bars
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
          label: (context: any) => `Spend: $${context.parsed.x.toLocaleString()}`
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
      x: {
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
      y: {
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
    <Card className="p-6" data-testid="chart-vendor-spend">
      <h3 className="text-lg font-semibold mb-4">Top 10 Vendors by Spend</h3>
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
    </Card>
  );
}
