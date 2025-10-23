import React from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import LazyImage from "../ui/LazyImage";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Package, 
  MapPin, 
  Phone, 
  Calendar, 
  Download,
  User,
  ShoppingBag,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  Truck
} from "lucide-react";


const OrderData = ({
  price,
  address,
  phone,
  city,
  createdAt,
  products,
  paymentMethod = "COD",
  status = "Pending",
  packerName,
  user,
  hideStatus = false,
  hideCOD = false,
}) => {

  const statusColors = {
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const statusIcons = {
    Pending: Clock,
    Completed: CheckCircle,
  };

  const handleDownloadInvoice = () => {
    try {
      const doc = new jsPDF();

      // Styles
      const primaryColor = [52, 152, 219]; // Admin blue
      const customerHeaderColor = [100, 100, 100]; // Dark gray
      const lightGray = [240, 240, 240];
      const borderColor = [200, 200, 200];
      const borderWidth = 0.5;
      const cellPadding = 5;

      // Customer Info
      const shopName = user?.name || "Shop Name";
      const orderDate = new Date(createdAt).toLocaleDateString();
      const cityText = city || "Not specified";
      const mobileText = phone ? String(phone) : "Not specified";
      const addressText = address || "Not specified";
      const maxAddressWidth = 170;
      const docAddressLines = doc.splitTextToSize(addressText, maxAddressWidth);

      const customerDetails = [
        [
          { content: `Order Date: ${orderDate}`, styles: { fontStyle: "bold" } },
          { content: `Shop Name: ${shopName}`, styles: { fontStyle: "bold" } }
        ],
        [
          { content: `Mobile: ${mobileText}` },
          { content: `City: ${cityText}` }
        ],
        [
          {
            content: `Address: ${docAddressLines.join(" ")}`,
            colSpan: 2,
            styles: {
              fillColor: lightGray,
              textColor: 0,
              lineColor: borderColor,
              lineWidth: borderWidth,
              halign: "left"
            }
          }
        ]
      ];

      autoTable(doc, {
        startY: 20,
        head: [
          [
            {
              content: "Customer Details",
              colSpan: 2,
              styles: {
                fillColor: primaryColor,
                textColor: 255,
                halign: 'center',
                fontStyle: 'bold',
                lineColor: borderColor,
                lineWidth: borderWidth
              }
            }
          ]
        ],
        body: customerDetails,
        theme: "grid",
        styles: {
          fillColor: 255,
          textColor: 0,
          lineColor: borderColor,
          lineWidth: borderWidth,
          cellPadding: cellPadding,
          fontSize: 10
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          lineColor: borderColor,
          lineWidth: borderWidth,
          cellPadding: cellPadding
        },
        columnStyles: {
          0: { cellWidth: 60, halign: 'left' },
          1: { cellWidth: 'auto', halign: 'left' }
        },
        margin: { left: 14, right: 14 },
        tableLineWidth: borderWidth,
        tableLineColor: borderColor,
      });

      // Product Table: Admin or Super Admin (role 1 or 2)
      if (Number(user?.role) === 1 || Number(user?.role) === 2) {
        const tableBody = products.map((product, idx) => [
          idx + 1,
          product?.id?.title || "Unnamed Product",
          product?.quantity || 0,
          product?.id?.price ? ` ${product.id.price}` : "",
          product?.quantity && product?.id?.price
            ? `${product.quantity * product.id.price}`
            : ""
        ]);

        const grandTotal = products.reduce(
          (sum, p) => sum + ((p?.quantity || 0) * (p?.id?.price || 0)),
          0
        );

        tableBody.push([
          {
            content: "Grand Total",
            colSpan: 4,
            styles: { halign: "right", fontStyle: "bold", fillColor: lightGray }
          },
          {
            content: `Rs. ${grandTotal}`,
            styles: { halign: "right", fontStyle: "bold", fillColor: lightGray }
          }
        ]);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [[
            { content: "ID", styles: { halign: 'center', fillColor: primaryColor, textColor: 255 } },
            { content: "Item", styles: { fillColor: primaryColor, textColor: 255 } },
            { content: "Qty", styles: { halign: 'center', fillColor: primaryColor, textColor: 255 } },
            { content: "Price", styles: { halign: 'center', fillColor: primaryColor, textColor: 255 } },
            { content: "Total", styles: { halign: 'center', fillColor: primaryColor, textColor: 255 } }
          ]],
          body: tableBody,
          theme: "grid",
          styles: {
            fontSize: 10,
            cellPadding: cellPadding,
            textColor: 0,
            lineColor: borderColor,
            lineWidth: borderWidth
          },
          headStyles: {
            fillColor: primaryColor,
            textColor: 255,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 16, halign: "center" },
            1: { cellWidth: 93 },
            2: { cellWidth: 18, halign: "center" },
            3: { cellWidth: 25, halign: "center" },
            4: { cellWidth: 30, halign: "center" }
          },
          margin: { left: 14, right: 14 }
        });
      } else {
        // Product Table: Customer (role 0)
        const customerTableBody = products.map((product, idx) => [
          idx + 1,
          product?.id?.title || "Unnamed Product",
          product?.quantity || 0
        ]);

        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 10,
          head: [[
            { content: "ID", styles: { halign: 'center', fillColor: primaryColor, textColor: 255 } },
            { content: "Product Name", styles: { fillColor: primaryColor, textColor: 255 } },
            { content: "Quantity", styles: { halign: 'center', fillColor: primaryColor, textColor: 255 } }
          ]],
          body: customerTableBody,
          theme: "grid",
          styles: {
            fontSize: 11,
            cellPadding: 6,
            textColor: 0,
            lineColor: borderColor,
            lineWidth: borderWidth
          },
          headStyles: {
            fillColor: customerHeaderColor,
            textColor: 255,
            fontStyle: 'bold'
          },
          columnStyles: {
            0: { cellWidth: 20, halign: "center" },
            1: { cellWidth: 132 },
            2: { cellWidth: 30, halign: "center" }
          },
          margin: { left: 14, right: 14 },
          tableLineWidth: borderWidth,
          tableLineColor: borderColor
        });
      }

      doc.save(`Order-Invoice-${orderDate}.pdf`);
    } catch (error) {
      console.error("Error generating invoice PDF:", error);
    }
  };

  const totalQuantity = products.reduce((sum, product) => sum + (product.quantity || 0), 0);
  const StatusIcon = statusIcons[status] || AlertCircle;

  return (
    <div className="space-y-6">
      {/* Order Summary Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-3">
                <ShoppingBag className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>
                <p className="text-gray-600">Complete order details and information</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!hideStatus && (
                <Badge className={`${statusColors[status]} border flex items-center gap-1`}>
                  <StatusIcon className="h-3 w-3" />
                  {status}
                </Badge>
              )}
              
              <Button 
                onClick={handleDownloadInvoice} 
                variant="outline" 
                size="sm"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-xl font-bold text-gray-900">{totalQuantity}</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <ShoppingBag className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Products</p>
              <p className="text-xl font-bold text-gray-900">{products.length}</p>
            </div>
            
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="text-lg font-bold text-gray-900">
                {new Date(createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Information */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Shop Name</p>
                <p className="text-gray-600">{user?.name || "Shop Name"}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone Number</p>
                <p className="text-gray-600">{phone}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Delivery Address</p>
                <p className="text-gray-600">{address}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Building className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">City</p>
                <p className="text-gray-600">{city}</p>
              </div>
            </div>


            {packerName && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <div>
                  <p className="text-sm font-medium text-emerald-900">Packed by</p>
                  <p className="text-emerald-700 font-medium">{packerName}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Order Date</p>
                <p className="text-gray-600">
                  {new Date(createdAt).toLocaleString('en-US', {
                    timeZone: 'Asia/Karachi',
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            
            
            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Order Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Products:</span>
                  <span className="font-medium">{products.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Quantity:</span>
                  <span className="font-medium">{totalQuantity}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products List */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Products ({products.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map((product, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="relative">
                  <LazyImage
                    src={product?.id?.picture?.secure_url}
                    alt={product?.id?.title || "Product image"}
                    className="h-16 w-16 rounded-lg object-cover border"
                    fallback="fallback.jpg"
                    quality={80}
                  />
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                    {product.quantity}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {product?.id?.title || "Unnamed Product"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Category: {product?.id?.category || "N/A"}
                  </p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-sm text-gray-600">
                      Quantity: <span className="font-medium">{product.quantity}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderData;