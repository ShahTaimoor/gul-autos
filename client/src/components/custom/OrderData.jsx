import React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { PDFDocument, rgb } from "pdf-lib";

const OrderData = ({
  price,
  address,
  createdAt,
  products,
  paymentMethod = "COD",
  status = "Pending",
}) => {


 const handleDownloadInvoice = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([600, 800]);

      // Header
      page.drawRectangle({
        x: 0,
        y: 720,
        width: 600,
        height: 80,
        color: rgb(0, 0.53, 0.71),
      });
      
      // Header Text
      page.drawText("INVOICE", {
        x: 50,
        y: 750,
        size: 28,
        color: rgb(1, 1, 1),
      });
      
      // Company Info (right aligned)
      const rightAlignX = 400;
      page.drawText("GUL", {
        x: rightAlignX,
        y: 750,
        size: 12,
        color: rgb(1, 1, 1),
      });
      page.drawText("GUL AUTOS", { 
        x: rightAlignX, 
        y: 735, 
        size: 10,
        color: rgb(1, 1, 1)
      });
      page.drawText("Email: support@company.com", { 
        x: rightAlignX, 
        y: 705, 
        size: 10,
        color: rgb(1, 1, 1)
      });
      page.drawText("Phone: +11111111111", { 
        x: rightAlignX, 
        y: 690, 
        size: 10,
        color: rgb(1, 1, 1)
      });

      // Customer Information Section
      const customerInfoYStart = 670;
      const labelX = 50;
      const valueX = 200;
      const lineHeight = 20;

      // Customer Info - using dynamic data where available
      const customerInfo = [
        { label: "Order Date", value: new Date(createdAt).toLocaleDateString() },
        { label: "Order Status", value: status },
        { label: "Payment Method", value: paymentMethod },
        { label: "Delivery Address", value: address || "Not specified", multiLine: true }
      ];

      let currentY = customerInfoYStart;
      
      customerInfo.forEach(info => {
        // Draw label
        page.drawText(info.label, {
          x: labelX,
          y: currentY,
          size: 12,
          color: rgb(0, 0, 0)
        });

        // Draw value
        if (info.multiLine) {
          page.drawText(info.value, {
            x: valueX,
            y: currentY,
            size: 12,
            maxWidth: 350,
            lineHeight: 15
          });
          currentY -= 30; // Extra space for multi-line
        } else {
          page.drawText(info.value, {
            x: valueX,
            y: currentY,
            size: 12
          });
          currentY -= lineHeight;
        }
      });

      // Order Details Section
      const orderDetailsY = currentY - 20;
      page.drawText("Order Details", {
        x: 50,
        y: orderDetailsY,
        size: 16,
        color: rgb(0, 0, 0),
      });

      // Table Layout
      const tableStartY = orderDetailsY - 30;
      const columnPositions = {
        item: 50,
        quantity: 250,
        price: 350,
        total: 450
      };

      // Table Header
      page.drawRectangle({
        x: columnPositions.item - 10,
        y: tableStartY,
        width: 500,
        height: 20,
        color: rgb(0.85, 0.85, 0.85),
      });
      
      page.drawText("Item", { x: columnPositions.item, y: tableStartY + 5, size: 12 });
      page.drawText("Quantity", { x: columnPositions.quantity, y: tableStartY + 5, size: 12 });
      page.drawText("Price", { x: columnPositions.price, y: tableStartY + 5, size: 12 });
      page.drawText("Total", { x: columnPositions.total, y: tableStartY + 5, size: 12 });

      // Table Rows - using the actual products prop
      let rowY = tableStartY - 20;
      let grandTotal = 0;
      
      products.forEach(product => {
        const productName = product?.id?.title || "Product";
        const quantity = product?.quantity || 0;
        const price = product?.id?.price || 0;
        const total = quantity * price;
        grandTotal += total;

        // Item name (with maxWidth to prevent overflow)
        page.drawText(productName, {
          x: columnPositions.item,
          y: rowY,
          size: 12,
          maxWidth: 180
        });
        
        // Quantity (centered)
        page.drawText(`${quantity}`, {
          x: columnPositions.quantity + 20,
          y: rowY,
          size: 12
        });
        
        // Price (right aligned)
        page.drawText(`Rs. ${price.toLocaleString()}`, {
          x: columnPositions.price + 30,
          y: rowY,
          size: 12
        });
        
        // Total (right aligned)
        page.drawText(`Rs. ${total.toLocaleString()}`, {
          x: columnPositions.total + 30,
          y: rowY,
          size: 12
        });
        
        rowY -= 20;
      });

      // Grand Total
      page.drawText("Grand Total:", {
        x: columnPositions.price,
        y: rowY - 20,
        size: 14,
        color: rgb(0, 0, 0)
      });
      page.drawText(`Rs. ${grandTotal.toLocaleString()}`, {
        x: columnPositions.total + 30,
        y: rowY - 20,
        size: 14,
        color: rgb(0, 0, 0)
      });

      // Footer
      page.drawRectangle({
        x: 0,
        y: 0,
        width: 600,
        height: 40,
        color: rgb(0.1, 0.1, 0.1),
      });
      page.drawText("Thank you for your order!", {
        x: 230,
        y: 15,
        size: 12,
        color: rgb(1, 1, 1),
      });

      // Download
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice_${new Date(createdAt).getTime()}.pdf`;
      link.click();
    } catch (error) {
      console.error("Error generating PDF invoice:", error);
      alert("Failed to generate invoice. Please try again.");
    }
  };


  return (
    <Card className="grid gap-2 p-2">
      {products.map((product, idx) => (
        <div
          key={idx}
          className="flex flex-col sm:flex-row justify-between items-end sm:items-center border p-3 rounded-lg bg-gray-100"
        >
          <div className="flex items-center gap-2">
            <img
              src={
                product?.id?.picture?.secure_url
                  ? product.id.picture.secure_url
                  : "fallback.jpg"
              }
              alt={product?.id?.title || "Product image"}
              className="h-20 w-20 rounded-lg object-cover"
            />
            <div className="grid">
              <h1>{product?.id?.title || "Unnamed Product"}</h1>
              <div className="flex flex-col gap-1 text-sm text-gray-600">
                <span>
                  <strong>Qty:</strong> {product.quantity}
                </span>

              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row justify-between sm:items-center">
        <span>Order On: {new Date(createdAt).toDateString()}</span>
        <span>
          Status: <strong>{status}</strong>
        </span>
        <span>
          Payment: <strong>{paymentMethod}</strong>
        </span>
      </div>
      <hr />
      <span>
        Delivery Address: <strong>{address}</strong>
      </span>
      <Button onClick={handleDownloadInvoice}>Download Invoice</Button>
    </Card>
  );
};

export default OrderData;
