import React, { useEffect, useState, useRef } from 'react';
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
import { fetchOrdersAdmin, updateOrderStatus, fetchPendingOrderCount } from '@/redux/slices/order/orderSlice';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { CalendarDays, List } from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const getPakistaniDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
};

const Orders = () => {
  const dispatch = useDispatch();
  const { orders, status, error } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getPakistaniDate());
  const [showAll, setShowAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [localOrders, setLocalOrders] = useState([]);
  const [packerNames, setPackerNames] = useState({});
  const [page, setPage] = useState(1);
  const limit = 30;
  const totalPages = useSelector((state) => state.orders.totalPages) || 1;
  const clickTimer = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Completed: 'bg-green-100 text-green-800',

  };

  const getImageBase64 = (url) =>
    fetch(url)
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          })
      );

  const handlePackerNameChange = (orderId, name) => {
    setPackerNames((prev) => ({
      ...prev,
      [orderId]: name,
    }));
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (newStatus === 'Completed') {
      const packer = packerNames[orderId];
      if (!packer) {
        toast.error('Please enter packer name first');
        return;
      }
    }

    try {
      const packer = packerNames[orderId] || '';
      await dispatch(updateOrderStatus({ orderId, status: newStatus, packerName: packer })).unwrap();
      toast.success(`Order marked as ${newStatus}`);

      setLocalOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
              ...order,
              status: newStatus,
              packerName: newStatus === 'Completed' ? packer : order.packerName,
            }
            : order
        )
      );

      dispatch(fetchPendingOrderCount());
    } catch (error) {
      toast.error(error?.message || 'Failed to update order status');
    }
  };

  useEffect(() => {
    dispatch(fetchOrdersAdmin({ page, limit }));
  }, [dispatch, page]);

useEffect(() => {
  if (status === 'succeeded') {
    setLocalOrders((prev) => {
      // Create a map of existing orders for quick lookup
      const orderMap = new Map(prev.map(order => [order._id, order]));
      
      // Update existing orders or add new ones
      const updatedOrders = orders.map(order => 
        orderMap.get(order._id) || order
      );
      
      // Preserve any orders that aren't in the new response
      const remainingOrders = prev.filter(order => 
        !orders.some(o => o._id === order._id)
      );
      
      return [...updatedOrders, ...remainingOrders];
    });

    // Initialize packer names
    const initialPackerNames = {};
    orders.forEach((order) => {
      if (order.packerName) {
        initialPackerNames[order._id] = order.packerName;
      }
    });
    setPackerNames((prev) => ({ ...prev, ...initialPackerNames }));
  }

  if (status === 'failed') {
    toast.error(error || 'Failed to fetch orders');
  }
}, [status, error, orders]);


  const todayString = getPakistaniDate();

  const filteredOrders = [...localOrders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((order) => {
      if (!showAll) {
        const orderDate = new Date(order.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Karachi' });
        return orderDate === selectedDate;
      }
      return true;
    })
    .filter((order) => {
      if (statusFilter !== 'All') {
        return order.status?.toLowerCase() === statusFilter.toLowerCase();
      }
      return true;
    })
    .filter((order) => {
      if (!searchQuery) return true;
      return (
        order._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.products.some((p) =>
          p?.id?.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    });

  const handleShare = async (order) => {
    const details = `
Order #${order._id.slice(-6)}
Status: ${order.status}
Amount: Rs. ${order.amount}
Products:
${order.products.map((p, i) =>
  `${i + 1}. ${p.id?.name} (Qty: ${p.quantity}, Price: Rs. ${p.id?.price})`
).join('\n')}
Shipping:
Address: ${order.address}
City: ${order.city}
Phone: ${order.phone}
    `.trim();

    const firstImageUrl = order.products[0]?.id?.picture?.secure_url || '/placeholder-product.jpg';

    if (navigator.canShare && navigator.canShare({ files: [] })) {
      try {
        const response = await fetch(firstImageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'order-product.jpg', { type: blob.type });

        await navigator.share({
          title: `Order #${order._id.slice(-6)}`,
          text: details,
          files: [file],
        });
      } catch (err) {
        if (navigator.share) {
          navigator.share({
            title: `Order #${order._id.slice(-6)}`,
            text: details,
          });
        } else {
          navigator.clipboard.writeText(details);
          toast.success('Order details copied to clipboard!');
        }
      }
    } else if (navigator.share) {
      navigator.share({
        title: `Order #${order._id.slice(-6)}`,
        text: details,
      });
    } else {
      navigator.clipboard.writeText(details);
      toast.success('Order details copied to clipboard!');
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(details)}`;
  };

  const handlePdfClick = (order) => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    clickTimer.current = setTimeout(async () => {
      setPdfLoading(true);
      await handleSharePDF(order, { download: false });
      setPdfLoading(false);
    }, 250);
  };

  const handlePdfDoubleClick = async (order) => {
    if (clickTimer.current) clearTimeout(clickTimer.current);
    setPdfLoading(true);
    await handleSharePDF(order, { download: true });
    setPdfLoading(false);
  };

  const handleSharePDF = async (order, { download = false } = {}) => {
    // 1. Prepare table data with images as base64
    const tableRows = await Promise.all(
      order.products.map(async (p) => {
        const imgUrl = p.id?.picture?.secure_url || "/placeholder-product.jpg";
        let imgData = "";
        try {
          imgData = await getImageBase64(imgUrl);
        } catch {
          imgData = ""; // fallback if image fails
        }
        return [
          { content: "", img: imgData }, // image cell
          p.id?.title || "",
          p.quantity || "",
          p.id?.price ? `Rs. ${p.id.price}` : "",
        ];
      })
    );

    // 2. Create PDF and add table
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(user?.name || 'Shop Name', doc.internal.pageSize.getWidth() / 2, 18, { align: 'center' });
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Amount: Rs. ${order.amount}`, 14, 28);
    doc.text(`Shipping: ${order.address}, ${order.city}, ${order.phone}`, 14, 34);

    // 3. Add table with images
    autoTable(doc, {
      startY: 40,
      head: [["Image", "Title", "Qty", "Price"]],
      body: tableRows,
      didDrawCell: function (data) {
        if (data.column.index === 0 && data.cell.raw && data.cell.raw.img) {
          doc.addImage(data.cell.raw.img, "JPEG", data.cell.x + 2, data.cell.y + 2, 45, 45);
        }
      },
      columnStyles: {
        0: { cellWidth: 49 },
        1: { cellWidth: 80 },
        2: { cellWidth: 20, halign: "left" },
        3: { cellWidth: 30, halign: "left" },
      },
      styles: { valign: "middle", fontSize: 10, cellPadding: 2, textColor: [0,0,0], halign: "left" },
      headStyles: { fillColor: [255,255,255], textColor: [0,0,0], fontStyle: 'bold', halign: "left" },
      bodyStyles: { minCellHeight: 49, halign: "left" },
      theme: 'grid',
    });

    // 4. Share or download PDF
    const pdfBlob = doc.output("blob");
    const pdfFile = new File([pdfBlob], `Order-${order._id.slice(-6)}.pdf`, { type: "application/pdf" });

    if (!download && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          title: `Order Details`,
          text: "Order details attached as PDF.",
          files: [pdfFile],
        });
        return;
      } catch (err) {
        // fallback to download
      }
    }
    // Always download if double click or share not supported
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Order-${order._id.slice(-6)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">View and manage customer orders</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Tabs defaultValue="all" className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all" onClick={() => setStatusFilter('All')}>All</TabsTrigger>
                <TabsTrigger value="pending" onClick={() => setStatusFilter('Pending')}>Pending</TabsTrigger>
                <TabsTrigger value="completed" onClick={() => setStatusFilter('Completed')}>Completed</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex gap-2">
              <Button variant={showAll ? 'outline' : 'default'} onClick={() => setShowAll(!showAll)} className="gap-2">
                <CalendarDays className="h-4 w-4" />
                {showAll ? 'Show Today' : 'Show All'}
              </Button>

              {!showAll && (
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  max={todayString}
                  className="border p-1 rounded-md"
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
              {showAll ? 'No orders found' : `No ${statusFilter.toLowerCase()} orders found for ${selectedDate}`}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search term' : 'Check back later for new orders'}
            </p>
          </div>
        ) : (
          <div className="grid w-[350px] lg:w-[900px] xl:w-[1400px] grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrders.map((order) => (
              <Card key={order._id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Order #{order._id.slice(-6)}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString('en-US', {
                          timeZone: 'Asia/Karachi',
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <Badge className={statusColors[order.status] || 'bg-gray-100 text-gray-800'}>
                      {order.status}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col h-full">
                  <div className="flex justify-between mb-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-semibold">Rs. {order.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Products</p>
                      <p className="text-lg font-semibold text-right">{order.products.length}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-2">
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

                  <div className="space-y-2 mb-2">
                    <p className="text-sm font-medium">Shipping Info</p>
                    <div className="text-sm">
                      <p className="truncate"><span className="text-muted-foreground">Address:</span> {order.address}</p>
                      <p><span className="text-muted-foreground">City:</span> {order.city}</p>
                      <p><span className="text-muted-foreground">Phone:</span> {order.phone}</p>
                    </div>
                  </div>

                  {order.status === 'Pending' && (
                    <div className="space-y-2 mt-2">
                      <p className="text-sm font-semibold">Packer Name</p>
                      <Input
                        placeholder="Enter packer name"
                        value={packerNames[order._id] || ''}
                        onChange={(e) => handlePackerNameChange(order._id, e.target.value)}
                      />
                    </div>
                  )}

                  {order.status === 'Completed' && order.packerName && (
                    <div className="mt-2 text-sm">
                      <p className="font-semibold">Packed by:</p>
                      <p>{order.packerName}</p>
                    </div>
                  )}

                  <div className="mt-auto space-y-2">
                    <p className="text-sm font-semibold">Update Status</p>
                    <Select
                      value={order.status || 'Pending'}
                      onValueChange={(newStatus) => handleStatusUpdate(order._id, newStatus)}
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

                <CardFooter className="flex flex-col gap-2">
                  <Dialog onOpenChange={(open) => open && setSelectedOrder(order)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
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
                        <div className="flex justify-end mb-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePdfClick(selectedOrder)}
                            onDoubleClick={() => handlePdfDoubleClick(selectedOrder)}
                            className="flex items-center gap-2"
                            disabled={pdfLoading}
                          >
                            {pdfLoading ? (
                              <>
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                </svg>
                                Loading...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V6M5 12l7-7 7 7" />
                                </svg>
                                Share/Download PDF
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {selectedOrder && (
                        <p className="text-xs text-gray-500 mt-1 text-right">
                          Single click to share, double click to download PDF
                        </p>
                      )}

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
                          packerName={selectedOrder.packerName}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setPage(pg)}
                className={`px-3 py-1 rounded border ${pg === page ? 'bg-yellow-400 text-white' : 'bg-white'}`}
              >
                {pg}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
