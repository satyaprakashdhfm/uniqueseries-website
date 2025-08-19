// Calculate order subtotal
exports.calculateSubtotal = (items) => {
  return items.reduce((total, item) => {
    return total + (parseFloat(item.unit_price) * item.quantity);
  }, 0);
};

// Calculate GST (now 0%)
exports.calculateGST = (subtotal) => {
  return 0;
};

// Calculate shipping cost: free if subtotal > 999, else ₹68
exports.calculateShipping = (subtotal) => {
  const sub = Number(subtotal) || 0;
  return sub > 999 ? 0 : 68;
};

// Calculate order total
exports.calculateTotal = (subtotal) => {
  const gst = this.calculateGST(subtotal);
  const shipping = this.calculateShipping(subtotal);
  return (Number(subtotal) || 0) + gst + shipping;
};

// Format currency as INR
exports.formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
};

// Generate a UPI payment URL
exports.generateUpiUrl = (paymentInfo) => {
  const { merchantVpa, amount, referenceId, transactionNote } = paymentInfo;
  
  const upiUrl = `upi://pay?pa=${merchantVpa}&pn=Currency%20Gift%20Store&am=${amount}&tr=${referenceId}&tn=${encodeURIComponent(transactionNote)}&cu=INR`;
  
  return upiUrl;
};

// Generate QR code data for payment
exports.generateQRCodeData = (paymentInfo) => {
  return this.generateUpiUrl(paymentInfo);
};