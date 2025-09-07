import React from 'react';
import './Policies.css';

const ShippingPolicy = () => {
  return (
    <div className="policy-container">
      <h1>Shipping Policy</h1>
      <div className="policy-content">
        <h2>Delivery Times</h2>
        <p>At uniqueseries.shop, order will be delivered in  15 working days.</p>

        <h2>Important Notes</h2>
        <ul>
          <li>Working days are counted from the day after your order is confirmed and payment is received</li>
          <li>Delivery times may vary based on your location and shipping address</li>
          <li>You will receive tracking information once your order is dispatched</li>
          <li>For customized products, the processing time starts after we receive your custom photos and instructions</li>
        </ul>

        <h2>Shipping Process</h2>
        <ol>
          <li>Order Confirmation: You'll receive an email confirming your order</li>
          <li>Processing: We'll begin creating your custom product</li>
          <li>Quality Check: Each product undergoes thorough quality inspection</li>
          <li>Dispatch: Your order is carefully packed and handed over to our shipping partner</li>
          <li>Tracking: You'll receive tracking details via email and SMS</li>
        </ol>

        <h2>Shipping Partners</h2>
        <p>We work with reliable courier partners to ensure safe and timely delivery of your precious products. All shipments are insured and handled with utmost care.</p>

        <h2>Contact Us</h2>
        <p>If you have any questions about your shipment, please contact our customer service team with your order number.</p>
      </div>
    </div>
  );
};

export default ShippingPolicy;
