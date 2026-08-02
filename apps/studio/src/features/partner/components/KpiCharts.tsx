import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

type Props = {
  byMonth: Array<{ month: string; count: number }>;
  responseRate: Array<{ invitationId: string; rate: number }>;
};

/** Lazy-loaded only from partner dashboard — must not enter apps/web bundle. */
export function KpiCharts({ byMonth, responseRate }: Props) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-secondary-foreground">
          Sự kiện tạo theo tháng
        </h3>
        <Line
          data={{
            labels: byMonth.map((r) => r.month),
            datasets: [
              {
                label: 'Sự kiện',
                data: byMonth.map((r) => r.count),
                borderColor: '#1F4E5F',
                backgroundColor: 'rgba(31,78,95,0.15)',
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
          }}
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-secondary-foreground">
          Tỉ lệ phản hồi (%)
        </h3>
        <Bar
          data={{
            labels: responseRate.map((_, i) => `KH ${i + 1}`),
            datasets: [
              {
                label: 'RSVP %',
                data: responseRate.map((r) => r.rate),
                backgroundColor: '#C4A574',
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, max: 100 } },
          }}
        />
      </div>
    </div>
  );
}

export default KpiCharts;
