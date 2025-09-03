import React from 'react';
import './Policies.css';

const ShippingPolicy = () => {
  return (
    <div className="policy-container">
      <h1>Shipping Policy</h1>
      <div className="policy-content">
        <h2>Delivery Times</h2>
        <p>At uniqueseries.shop, we are committed to delivering your custom products within the specified timeframes:</p>
        
        <h3>Currency Notes</h3>
        <ul>
          <li>₹1, ₹5, ₹10, ₹20 Notes: 3 working days</li>
          <li>₹50, ₹100 Notes: 6 working days</li>
          <li>₹200, ₹500 Notes: 7 working days</li>
          <li>₹2 Notes: 14 working days</li>
        </ul>

        <h3>Photo Frames</h3>
        <ul>
          <li>Small Size (1 note, 1 name): 10 working days</li>
          <li>Small Size (2 notes, 2 names): 10 working days</li>
          <li>Custom Frames: 12 working days</li>
          <li>Big Size (1-200 set, 2 notes, 2 names): 15 working days</li>
          <li>Big Size (1-500 set, 2 notes, 2 names): 15 working days</li>
        </ul>

        <h3>Resin Frames</h3>
        <ul>
          <li>Small Resin Frame: 8 working days</li>
          <li>Large Resin Frame: 8 working days</li>
        </ul>

        <h3>Zodiac Products</h3>
        <ul>
          <li>Zodiac Coin: 5 working days</li>
          <li>Zodiac Stamp: 5 working days</li>
        </ul>

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
