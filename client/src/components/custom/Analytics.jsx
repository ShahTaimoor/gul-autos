import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, ArrowUpRight, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
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
  return pakistanTime.toLocaleDateString('en-PK', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

const Analytics = () => {
  const dispatch = useDispatch();
  const [selectedDate, setSelectedDate] = useState(() => toPakistanDateString(new Date()));
  const [isExporting, setIsExporting] = useState(false);

  const {
    metrics: data,
    metricsStatus: status,
    metricsError: error,
  } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrdersMetrics());
  }, [dispatch]);

  const exportToCSV = async () => {
    setIsExporting(true);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!data) {
      setIsExporting(false);
      return;
    }

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
    link.setAttribute('download', `analytics_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExporting(false);
  };

  if (status === 'loading') return (
    <div className="p-8 flex justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
      />
    </div>
  );

  if (status === 'failed') return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 text-red-500 text-center"
    >
      {error}
    </motion.div>
  );

  if (!data) return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 text-center text-gray-500"
    >
      No data available.
    </motion.div>
  );

  // Filter sales by selected date in Pakistan time
  const filteredSales = selectedDate
    ? data.salesByDate?.filter(entry => toPakistanDateString(entry.date) === selectedDate)
    : [];

  const totalForSelectedDate = filteredSales?.reduce((acc, cur) => acc + cur.totalAmount, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* Header with Date Picker */}
      <motion.div 
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.h1 
          className="text-3xl font-bold text-gray-900"
          initial={{ x: -20 }}
          animate={{ x: 0 }}
        >
          Analytics Dashboard
        </motion.h1>
        
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div whileHover={{ scale: 1.02 }}>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-2 border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              max={toPakistanDateString(new Date())}
            />
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={exportToCSV} 
              disabled={isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export Report
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Total for selected date */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <p className="text-sm text-gray-500 mb-1">
            Total Sales for {toPakistanDateDisplay(selectedDate)}:
          </p>
          <motion.p 
            className="text-2xl font-bold text-green-600"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            key={totalForSelectedDate || 0}
          >
            Rs.{(totalForSelectedDate || 0).toLocaleString()}
          </motion.p>
        </div>
      </motion.div>

      {/* Main Metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <MetricCard 
          title="Total Sales" 
          value={`Rs.${data.totalSales.count.toLocaleString()}`} 
          growth={data.totalSales.growth} 
          color="green" 
        />
        <MetricCard 
          title="Total Orders" 
          value={data.recentSales.orders?.length || 0} 
          growth={data.sales.growth} 
          color="blue" 
        />
        <MetricCard 
          title="Active Now" 
          value={data.activeNow.count} 
          growth={data.activeNow.growth} 
          color="purple" 
        />
        <MetricCard 
          title="New Users" 
          value={data.users.count} 
          growth={data.users.growth} 
          color="orange" 
        />
      </motion.div>

      {/* Recent Orders */}
      <motion.div 
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
        <div className="space-y-3">
          <AnimatePresence>
            {data.recentSales.orders.map((order, index) => (
              <motion.div 
                key={order._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <ArrowUpRight className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{order.userId?.name || 'Guest'}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString('en-PK')}
                    </p>
                  </div>
                </div>
                <p className="font-bold text-green-600">Rs.{order.amount.toLocaleString()}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
};

const MetricCard = ({ title, value, growth, color }) => {
  const colorClasses = {
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      icon: <ChevronUp className="w-4 h-4" />
    },
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      icon: <ChevronUp className="w-4 h-4" />
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      icon: <ChevronUp className="w-4 h-4" />
    },
    orange: {
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      icon: growth < 0 ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />
    }
  };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
      className={`bg-white p-6 rounded-xl border border-gray-200 ${colorClasses[color].bg} transition-all`}
    >
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <motion.p 
        className="text-2xl font-bold mb-2"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {value}
      </motion.p>
      <div className={`flex items-center text-sm ${growth < 0 ? 'text-red-500' : colorClasses[color].text}`}>
        {colorClasses[color].icon}
        <span className="ml-1">
          {Math.abs(growth)}% {growth < 0 ? 'decrease' : 'increase'} from last month
        </span>
      </div>
    </motion.div>
  );
};

export default Analytics;