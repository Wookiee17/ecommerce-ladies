const generateInvoiceHtml = (order) => {
  const itemsRows = order.items.map((item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${item.price}</td>
        <td>${item.quantity * item.price}</td>
      </tr>
  `).join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Invoice ${order.orderNumber}</title>
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ddd; padding: 8px; font-size: 14px; }
          th { background: #f5f5f5; text-align: left; }
        </style>
      </head>
      <body>
        <h1>Invoice #${order.orderNumber}</h1>
        <p><strong>Date:</strong> ${order.createdAt.toISOString()}</p>
        <p><strong>Customer:</strong> ${order.user?.name || ''}</p>
        <p><strong>Shipping Address:</strong> ${order.shippingAddress?.address || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}</p>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
        <h3>Total: ${order.payment?.amount || 0} ${order.payment?.currency || 'INR'}</h3>
      </body>
    </html>
  `;
};

module.exports = {
  generateInvoiceHtml
};

