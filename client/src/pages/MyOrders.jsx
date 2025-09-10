import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Loader2, Trash2 } from 'lucide-react';
import { PageLoader } from '@/components/ui/unified-loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import OrderData from '@/components/custom/OrderData';
import { fetchOrders, deleteOrder } from '@/redux/slices/order/orderSlice';
import { toast } from 'sonner';

// Helper to get today date in 'yyyy-mm-dd' format for Pakistan timezone
const getPakistaniDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
};

const MyOrders = () => {
  const dispatch = useDispatch();

  const { orders, status, error } = useSelector((state) => state.orders);

  const [selectedDate, setSelectedDate] = useState(getPakistaniDate);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleDeleteOrder = async (orderId) => {
    try {
      await dispatch(deleteOrder(orderId)).unwrap();
      toast.success('Order deleted successfully and stock restored');
    } catch (error) {
      toast.error(error?.message || 'Failed to delete order');
    }
  };

  // Filter orders by selected date based on Pakistan timezone
  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt)
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
    return orderDate === selectedDate;
  });

  if (status === 'loading') {
    return (
      <div className="w-full h-full">
        <PageLoader message="Loading Orders..." />
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
        max={getPakistaniDate()} // restrict max date to today in Pakistan timezone
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
              <div key={order._id} className="relative">
                <OrderData {...order} />
                <div className="absolute top-2 right-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Order</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this order? This action will:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Permanently remove the order from your account</li>
                            <li>Restore the product stock that was deducted</li>
                            <li>This action cannot be undone</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteOrder(order._id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Order
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
