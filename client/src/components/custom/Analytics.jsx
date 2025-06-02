import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../ui/button';
import { fetchOrdersMetrics } from '@/redux/slices/order/orderSlice';

// Helpers for Pakistan date conversion
function toPakistanDateString(date) {
  const d = new Date(date);
  const pakistanOffset = 5 * 60;
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const pakistanTime = new Date(utc + pakistanOffset * 60000);

  const year = pakistanTime.getFullYear();
  const month = String(pakistanTime.getMonth() + 1).padStart(2, '0');
  const day = String(pakistanTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toPakistanDateDisplay(date) {
  const d = new Date(date);
  const pakistanOffset = 5 * 60;
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const pakistanTime = new Date(utc + pakistanOffset * 60000);
  return pakistanTime.toDateString();
}

const Analytics = () => {
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState(() => toPakistanDateString(new Date()));

  const {
    metrics: data,
    metricsStatus: status,
    metricsError: error,
  } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrdersMetrics());
  }, [dispatch]);

  const exportToCSV = () => {
    if (!data) return;

    const csvRows = [
      ['Metric', 'Count', 'Growth'],
      ['Total Sales', data.totalSales.count, `${data.totalSales.growth}%`],
      ['Total Orders', data.recentSales.orders?.length || 0, `${data.sales.growth}%`],
      ['Active Now', data.activeNow.count, `${data.activeNow.growth}%`],
      ['New Users', data.users.count, `${data.users.growth}%`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'analytics_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (status === 'loading') return <div className="p-8">Loading...</div>;
  if (status === 'failed') return <div className="p-8 text-red-500">{error}</div>;
  if (!data) return <div className="p-8">No data available.</div>;

  // Filter sales by selected date in Pakistan time
  const filteredSales = selectedDate
    ? data.salesByDate?.filter(entry => toPakistanDateString(entry.date) === selectedDate)
    : [];

  const totalForSelectedDate = filteredSales?.reduce((acc, cur) => acc + cur.totalAmount, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Date Picker at Top */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="border rounded px-3 py-1 text-sm"
          max={toPakistanDateString(new Date())}
        />
      </div>

      {/* Total for selected date */}
      <div className="mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border w-full sm:w-1/2">
          <p className="text-sm text-gray-500 mb-1">
            Total Sales for {toPakistanDateDisplay(selectedDate)}:
          </p>
          <p className="text-xl font-bold text-green-600">Rs.{totalForSelectedDate || 0}</p>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={exportToCSV}>
          Export Report
        </Button>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="Total Sales" value={`Rs.${data.totalSales.count}`} growth={`${data.totalSales.growth}%`} color="green" />
        <MetricCard title="Total Orders" value={data.recentSales.orders?.length || 0} growth={`${data.sales.growth}%`} color="blue" />
        <MetricCard title="Active Now" value={data.activeNow.count} growth={`${data.activeNow.growth}%`} color="purple" />
        <MetricCard title="New Users" value={data.users.count} growth={`${data.users.growth}%`} color="orange" />
      </div>

      {/* Recent Orders */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
        <div className="space-y-4">
          {data.recentSales.orders.map((order, index) => (
            <div key={index} className="flex justify-between p-3 hover:bg-gray-50 rounded-lg">
              <p className="text-gray-700">{order.userId?.name || 'Guest'}</p>
              <p className="text-gray-700 font-medium">Rs.{order.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, growth, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-bold mt-2">{value}</p>
    <p className={`text-sm mt-2 text-${color}-600`}>↑ {growth} from last month</p>
  </div>
);

export default Analytics;
