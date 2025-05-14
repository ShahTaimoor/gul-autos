import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import OrderData from '@/components/custom/OrderData';
import { fetchOrders } from '@/redux/slices/order/orderSlice';

const MyOrders = () => {
  const dispatch = useDispatch();

  const { orders, status, error } = useSelector((state) => state.orders);


  
  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  if (status === 'loading') {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div className="w-[90vw] lg:w-[50vw] mx-auto my-10 sm:my-32 grid gap-3">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {status === 'failed' ? (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || 'Something went wrong fetching your orders.'}</AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-3">
          {orders.length === 0 ? (
            <p className="text-gray-500">No orders found.</p>
          ) : (
            orders.map((order) => (
              <OrderData key={order._id} {...order} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
