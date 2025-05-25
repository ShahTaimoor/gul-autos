import React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const OrderData = ({
  price,
  address,
  phone,
  city,
  createdAt,
  products,
  paymentMethod = "COD",
  status = "Pending",
}) => {

const handleDownloadInvoice = async (orderDetails) => {
    try {
        

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 800]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

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
            font,
            color: rgb(1, 1, 1),
        });

        // Company Info
        const rightAlignX = 400;
        page.drawText("GUL", {
            x: rightAlignX,
            y: 750,
            size: 12,
            font,
            color: rgb(1, 1, 1),
        });
        page.drawText("GUL AUTOS", {
            x: rightAlignX,
            y: 735,
            size: 10,
            font,
            color: rgb(1, 1, 1),
        });
        page.drawText("Email: support@gulautos.com", {
            x: rightAlignX,
            y: 705,
            size: 10,
            font,
            color: rgb(1, 1, 1),
        });
        page.drawText("Phone: +92 3114000096", {
            x: rightAlignX,
            y: 690,
            size: 10,
            font,
            color: rgb(1, 1, 1),
        });

        // Customer Info
        const customerInfoYStart = 670;
        const labelX = 50;
        const valueX = 200;
        const lineHeight = 20;

        const customerInfo = [
            { label: "Order Date", value: new Date(createdAt).toLocaleDateString() },
            { label: "Order Status", value: status },
            { label: "Payment Method", value: paymentMethod },
            { label: "Delivery Address", value: address || "Not specified", multiLine: true },
            { label: "City", value: city || "Not specified", multiLine: true },
            { label: "Mobile Number", value: phone ? String(phone) : "Not specified", multiLine: true },
        ];

        let currentY = customerInfoYStart;
        customerInfo.forEach(info => {
            page.drawText(info.label, {
                x: labelX,
                y: currentY,
                size: 12,
                font,
                color: rgb(0, 0, 0),
            });

            page.drawText(info.value, {
                x: valueX,
                y: currentY,
                size: 12,
                font,
                maxWidth: 350,
            });

            currentY -= info.multiLine ? 30 : lineHeight;
        });

        // Border for customer info
        const borderX = labelX - 20;
        const borderY = currentY + 20;
        const borderWidth = 510;
        const borderHeight = customerInfoYStart - currentY + 10;

        ["Top", "Bottom", "Left", "Right"].forEach((side) => {
            const start = {
                Top: { x: borderX, y: borderY + borderHeight },
                Bottom: { x: borderX, y: borderY },
                Left: { x: borderX, y: borderY },
                Right: { x: borderX + borderWidth, y: borderY },
            }[side];

            const end = {
                Top: { x: borderX + borderWidth, y: borderY + borderHeight },
                Bottom: { x: borderX + borderWidth, y: borderY },
                Left: { x: borderX, y: borderY + borderHeight },
                Right: { x: borderX + borderWidth, y: borderY + borderHeight },
            }[side];

            page.drawLine({ start, end, thickness: 1, color: rgb(0, 0, 0) });
        });

        // Order Details
        const orderDetailsY = currentY - 20;
        page.drawText("Order Details", {
            x: 50,
            y: orderDetailsY,
            size: 16,
            font,
            color: rgb(0, 0, 0),
        });

        // Table setup
        const tableStartY = orderDetailsY - 30;
        // Adjusted column positions and widths for mixed alignment
        const columnPositions = { id: 40, item: 80, quantity: 280, price: 370, total: 470 };
        const columnWidths = { id: 30, item: 190, quantity: 70, price: 100, total: 90 };

        // Header
        page.drawRectangle({
            x: columnPositions.id - 10,
            y: tableStartY,
            width: 510,
            height: 20,
            color: rgb(0.85, 0.85, 0.85),
        });

        // Header text alignment (left-aligned)
        ["ID", "Item", "Quantity", "Price", "Total"].forEach((header, i) => {
            const x = [columnPositions.id, columnPositions.item, columnPositions.quantity, columnPositions.price, columnPositions.total][i];
            page.drawText(header, { x, y: tableStartY + 5, size: 12, font });
        });

        // Row rendering
        let rowY = tableStartY - 30;
        let grandTotal = 0;
        const fontSize = 10;
        const rowLineHeight = 14;
        const maxItemWidth = columnWidths.item;

        const wrapText = (text, maxWidth) => {
            const words = text.split(" ");
            let lines = [], currentLine = "";

            words.forEach((word) => {
                const testLine = currentLine ? currentLine + " " + word : word;
                const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);
                if (testLineWidth < maxWidth) {
                    currentLine = testLine;
                } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                }
            });

            if (currentLine) lines.push(currentLine);
            return lines;
        };

        products.forEach((product, index) => {
            const productId = index + 1;
            const productName = product?.id?.title || "Product";
            const quantity = product?.quantity || 0;
            const price = product?.id?.price || 0;
            const total = quantity * price;
            grandTotal += total;

            const wrappedNameLines = wrapText(productName, maxItemWidth);
            const rowHeight = Math.max(rowLineHeight, wrappedNameLines.length * rowLineHeight); // Ensure minimum height

            // Calculate vertical center for single-line items like ID, Quantity, Price, Total
            const centerY = rowY - (rowHeight / 2) + (fontSize / 2);

            // ID (left-aligned)
            page.drawText(String(productId), {
                x: columnPositions.id,
                y: centerY,
                size: fontSize,
                font,
            });

            // Item Name (left-aligned, wrapped)
            wrappedNameLines.forEach((line, idx) => {
                page.drawText(line, {
                    x: columnPositions.item,
                    y: rowY - (idx * rowLineHeight),
                    size: fontSize,
                    font,
                });
            });

            // Quantity (CENTERED)
            const quantityText = `${quantity}`;
            const quantityTextWidth = font.widthOfTextAtSize(quantityText, fontSize);
            const quantityX = columnPositions.quantity + (columnWidths.quantity / 3) - (quantityTextWidth / 3);
            page.drawText(quantityText, {
                x: quantityX,
                y: centerY,
                size: fontSize,
                font,
            });

            // Price (left-aligned)
            page.drawText(`Rs. ${price.toLocaleString('en-IN')}`, {
                x: columnPositions.price,
                y: centerY,
                size: fontSize,
                font,
            });

            // Total (left-aligned)
            page.drawText(`Rs. ${total.toLocaleString('en-IN')}`, {
                x: columnPositions.total,
                y: centerY,
                size: fontSize,
                font,
            });

            rowY -= (rowHeight + 6);
        });

        // Table borders
        const tableX = columnPositions.id - 10;
        const tableY = tableStartY + 20;
        const tableHeight = tableStartY - rowY + 30;

        ["Top", "Bottom", "Left", "Right"].forEach((side) => {
            const start = {
                Top: { x: tableX, y: tableY },
                Bottom: { x: tableX, y: tableY - tableHeight },
                Left: { x: tableX, y: tableY - tableHeight },
                Right: { x: tableX + 510, y: tableY - tableHeight },
            }[side];

            const end = {
                Top: { x: tableX + 510, y: tableY },
                Bottom: { x: tableX + 510, y: tableY - tableHeight },
                Left: { x: tableX, y: tableY },
                Right: { x: tableX + 510, y: tableY },
            }[side];

            page.drawLine({ start, end, thickness: 1, color: rgb(0, 0, 0) });
        });

        // Grand Total
        const grandTotalY = rowY - 30;

        page.drawLine({
            start: { x: columnPositions.price, y: grandTotalY + 20 },
            end: { x: columnPositions.total , y: grandTotalY + 20 },
            thickness: 1,
            color: rgb(0, 0, 0),
        });

        // Grand Total label (left-aligned with price column)
        page.drawText("Grand Total:", {
            x: columnPositions.price,
            y: grandTotalY,
            size: 14,
            font,
        });

        // Grand Total value (left-aligned with total column)
        const finalTotalText = `Rs. ${grandTotal.toLocaleString('en-IN')}`;
        page.drawText(finalTotalText, {
            x: columnPositions.total,
            y: grandTotalY,
            size: 14,
            font,
        });

        // Save and download
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "invoice.pdf";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error generating invoice PDF:", error);
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
      <span>
        City: <strong>{city}</strong>
      </span>
      <span>
        Mobile Number: <strong>{phone}</strong>
      </span>
      <Button onClick={handleDownloadInvoice}>Download Invoice</Button>
    </Card>
  );
};

export default OrderData;
