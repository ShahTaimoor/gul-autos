import React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import LazyImage from "../ui/LazyImage";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const OrderData = ({
  price,
  address,
  phone,
  city,
  createdAt,
  products,
  paymentMethod = "COD",
  status = "Pending",
  user,
}) => {

  
  

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


  return (
    <Card className="grid gap-2 p-2">
      {products.map((product, idx) => (
        <div
          key={idx}
          className="flex flex-col sm:flex-row justify-between items-end sm:items-center border p-3 rounded-lg bg-gray-100"
        >
          <div className="flex items-center gap-2">
            <LazyImage
              src={product?.id?.picture?.secure_url}
              alt={product?.id?.title || "Product image"}
              className="h-20 w-20 rounded-lg"
              fallback="fallback.jpg"
              quality={80}
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
