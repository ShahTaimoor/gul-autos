import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import OrderData from '@/components/custom/OrderData';
import { fetchOrders } from '@/redux/slices/order/orderSlice';

const MyOrders = () => {
  const dispatch = useDispatch();

  const { orders, status, error } = useSelector((state) => state.orders);

  const [selectedDate, setSelectedDate] = useState(() => {
    // Default to today, formatted as yyyy-mm-dd for input[type=date]
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  // Filter orders by selected date
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
    return orderDate === selectedDate;
  });

  if (status === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="w-[90vw] lg:w-[50vw] mx-auto my-10 sm:my-32 grid gap-3">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      {/* Date picker */}
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="mb-6 p-2 border rounded"
        max={new Date().toISOString().split('T')[0]} // Optional: restrict max date to today
      />

      {status === 'failed' ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Something went wrong fetching your orders.'}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-3">
          {filteredOrders.length === 0 ? (
            <p className="text-gray-500">No orders found for {selectedDate}.</p>
          ) : (
            filteredOrders.map((order) => (
              <OrderData key={order._id} {...order} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
