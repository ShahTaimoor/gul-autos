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
import { fetchOrdersAdmin } from '@/redux/slices/order/orderSlice';

const Orders = () => {
    const dispatch = useDispatch();
    const { orders, status, error } = useSelector((state) => state.orders);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // For filtering by date
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    useEffect(() => {
        dispatch(fetchOrdersAdmin());
    }, [dispatch]);

    useEffect(() => {
        if (status === 'failed') {
            toast.error(error || 'Failed to fetch orders');
        }
    }, [status, error]);

    // Filter orders by selected date (yyyy-mm-dd)
    const filteredOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === selectedDate;
    });

    return (
        <div className="px-6 py-10">
            <h1 className="text-2xl font-bold mb-8">My Orders</h1>

            {/* Date picker for filtering */}
            <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mb-6 p-2 border rounded"
                max={new Date().toISOString().split('T')[0]}
            />

            {status === 'loading' ? (
                <div className="text-center text-gray-500">Loading orders...</div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center text-gray-500">No orders found for {selectedDate}.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredOrders.map((order) => (
                        <div
                            key={order._id}
                            className="flex flex-col bg-white border rounded-2xl shadow-md p-6 hover:shadow-lg transition"
                            style={{ minHeight: '450px', position: 'relative' }} // Set minHeight to keep cards consistent
                        >
                            {/* Order Header */}
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold truncate">Order ID: {order._id}</h2>
                                <p className="text-sm text-gray-500">{new Date(order.createdAt).toDateString()}</p>
                            </div>

                            {/* Order Summary */}
                            <div className="flex justify-between mb-4">
                                <div>
                                    <p className="text-gray-500 text-sm">Total Amount</p>
                                    <p className="text-lg font-bold text-green-600">Rs.{order.amount}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-sm">Items</p>
                                    <p className="text-lg font-bold">{order.products.length}</p>
                                </div>
                            </div>

                            {/* Products List */}
                            <div className="flex flex-col gap-3 max-h-40 overflow-y-auto pr-2 mb-4">
                                {order.products.map((item, index) => (
                                    <div key={index} className="flex items-center gap-3 border-b pb-2 last:border-none">
                                        <img
                                            src={item?.id?.picture?.secure_url ? item.id.picture.secure_url : 'fallback.jpg'}
                                            alt={item.id?.name || 'Product Image'}
                                            className="w-10 h-10 object-cover rounded-md"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-800 truncate">{item.id?.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-700">Rs.{item.id?.price}</p>
                                    </div>
                                ))}
                            </div>



                            {/* Actions - positioned at the bottom */}
                            <div className="mt-auto pt-6">
                                {/* Shipping Address */}
                                <div className="mb-1">
                                    <p className="text-gray-500 text-sm">Shipping Address</p>
                                    <p className="text-gray-700 text-sm font-medium mt-1">{order.address.slice(0,80)}</p>
                                </div>
                                <div className="mb-1">
                                    <p className="text-gray-500 text-sm">City</p>
                                    <p className="text-gray-700 text-sm font-medium mt-1">{order.city.slice(0,20)}</p>
                                </div>
                                <div className="mb-1">
                                    <p className="text-gray-500 text-sm">Phone</p>
                                    <p className="text-gray-700 text-sm font-medium mt-1">{order.phone}</p>
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full rounded-lg"
                                            onClick={() => setSelectedOrder(order)}
                                        >
                                            View Invoice
                                        </Button>
                                    </DialogTrigger>

                                    <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Invoice Details</DialogTitle>
                                            <DialogDescription>Here’s the full invoice for this order.</DialogDescription>
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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
