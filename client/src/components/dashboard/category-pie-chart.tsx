/**
 * Category Pie Chart Component
 * 
 * Pie chart showing spending breakdown by category
 */

import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Skeleton } from '@/components/ui/skeleton';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryData {
  labels: string[];
  data: number[];
}

export default function CategoryPieChart() {
  const { data, isLoading } = useQuery<CategoryData>({
    queryKey: ['/api/category-spend']
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
        data: data?.data || [],
        backgroundColor: [
          'hsl(var(--chart-1))',
          'hsl(var(--chart-2))',
          'hsl(var(--chart-3))',
          'hsl(var(--chart-4))',
          'hsl(var(--chart-5))',
          'hsl(217, 70%, 50%)',
          'hsl(142, 60%, 50%)',
          'hsl(24, 70%, 50%)'
        ],
        borderWidth: 2,
        borderColor: 'hsl(var(--card))'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 12,
          usePointStyle: true,
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12
          },
          color: 'hsl(var(--foreground))'
        }
      },
      tooltip: {
        backgroundColor: 'hsl(var(--popover))',
        titleColor: 'hsl(var(--popover-foreground))',
        bodyColor: 'hsl(var(--popover-foreground))',
        borderColor: 'hsl(var(--border))',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${value.toLocaleString()} (${percentage}%)`;
          }
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif'
        },
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          weight: '600'
        }
      }
    }
  };

  return (
    <Card className="p-6" data-testid="chart-category-spend">
      <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
      <div className="h-64">
        <Pie data={chartData} options={options} />
      </div>
    </Card>
  );
}
