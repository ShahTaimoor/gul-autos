import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import OrderData from './OrderData';
import { fetchOrdersAdmin, updateOrderStatus } from '@/redux/slices/order/orderSlice';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { CalendarDays, List, Search } from 'lucide-react';

const getPakistaniDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
};

const statusColors = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-800',
  Processing: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-red-100 text-red-800',
};

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, status, error } = useSelector((state) => state.orders);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getPakistaniDate());
  const [showAll, setShowAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [localOrders, setLocalOrders] = useState([]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
      toast.success(`Order status updated to ${newStatus}`);

      setLocalOrders(prev =>
        prev.map(order =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

      if (statusFilter !== 'All' && statusFilter !== newStatus) {
        setLocalOrders(prev => prev.filter(o => o._id !== orderId));
      }
    } catch (error) {
      toast.error(error || 'Failed to update order status');
    }
  };

  useEffect(() => {
    dispatch(fetchOrdersAdmin());
  }, [dispatch]);

  useEffect(() => {
    if (status === 'succeeded') {
      setLocalOrders(orders);
    }
    if (status === 'failed') {
      toast.error(error || 'Failed to fetch orders');
    }
  }, [status, error, orders]);

  const todayString = getPakistaniDate();

  const filteredOrders = [...localOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter(order => {
      if (!showAll) {
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-CA', {
          timeZone: 'Asia/Karachi',
        });
        return orderDate === selectedDate;
      }
      return true;
    })
    .filter(order => {
      if (statusFilter !== 'All') {
        return order.status?.toLowerCase() === statusFilter.toLowerCase();
      }
      return true;
    })
    .filter(order => {
      if (!searchQuery) return true;
      return (
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.products.some(p => 
          p.id?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    });

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            View and manage customer orders
          </p>
        </div>
        
        
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs defaultValue="all" className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all" onClick={() => setStatusFilter('All')}>
                  All
                </TabsTrigger>
                <TabsTrigger value="pending" onClick={() => setStatusFilter('Pending')}>
                  Pending
                </TabsTrigger>
                <TabsTrigger value="completed" onClick={() => setStatusFilter('Completed')}>
                  Completed
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Button
                variant={showAll ? "outline" : "default"}
                onClick={() => setShowAll(!showAll)}
                className="gap-2"
              >
                <CalendarDays className="h-4 w-4" />
                {showAll ? "Show Today" : "Show All"}
              </Button>
              
              {!showAll && (
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-[150px]"
                  max={todayString}
                />
              )}
            </div>
          </div>
        </div>

        {status === 'loading' ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-2">
            <List className="h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">
              {showAll
                ? 'No orders found'
                : `No ${statusFilter.toLowerCase()} orders found for ${selectedDate}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Check back later for new orders'}
            </p>
          </div>
        ) : (
          <div className="grid lg:w-[900px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <Card key={order._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Order #{order._id.slice(-6)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          timeZone: 'Asia/Karachi',
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-semibold">Rs. {order.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-lg font-semibold text-right">{order.products.length}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Products</p>
                    <ScrollArea className="h-32 rounded-md border">
                      <div className="p-2 space-y-2">
                        {order.products.map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <img
                              src={item?.id?.picture?.secure_url || '/placeholder-product.jpg'}
                              alt={item.id?.name}
                              className="w-10 h-10 rounded-md object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.id?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {item.quantity} × Rs. {item.id?.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Shipping Info</p>
                    <div className="text-sm">
                      <p className="truncate">
                        <span className="text-muted-foreground">Address:</span> {order.address}
                      </p>
                      <p>
                        <span className="text-muted-foreground">City:</span> {order.city}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Phone:</span> {order.phone}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Update Status</p>
                    <Select
                      value={order.status || 'Pending'}
                      onValueChange={(value) => handleStatusUpdate(order._id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-end">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedOrder(order)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                          Complete information for order #{order._id.slice(-6)}
                        </DialogDescription>
                      </DialogHeader>
                      {selectedOrder && (
                        <OrderData
                          price={selectedOrder.amount}
                          address={selectedOrder.address}
                          phone={selectedOrder.phone}
                          city={selectedOrder.city}
                          createdAt={selectedOrder.createdAt}
                          products={selectedOrder.products}
                          paymentMethod={selectedOrder.paymentMethod || 'COD'}
                          status={selectedOrder.status || 'Pending'}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;