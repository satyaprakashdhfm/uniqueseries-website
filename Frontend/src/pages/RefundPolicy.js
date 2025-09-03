import React from 'react';
import './Policies.css';

const RefundPolicy = () => {
  return (
    <div className="policy-container">
      <h1>Refund & Return Policy</h1>
      <div className="policy-content">
        <h2>Custom Products</h2>
        <p>Since all our products are custom-made according to your specifications, we have a specialized refund policy:</p>
        
        <h3>Before Production</h3>
        <ul>
          <li>Full refund if cancelled before production starts</li>
          <li>Cancellation must be requested within 24 hours of placing the order</li>
        </ul>

        <h3>During Production</h3>
        <ul>
          <li>Once production begins, refunds are not possible as these are personalized items</li>
          <li>Design changes can be accommodated only if production hasn't started</li>
        </ul>

        <h3>After Delivery</h3>
        <ul>
          <li>In case of manufacturing defects, we offer free replacement</li>
          <li>Damage must be reported within 24 hours of delivery with clear photos</li>
          <li>Shipping damages must be reported immediately upon delivery</li>
        </ul>

        <h2>Refund Process</h2>
        <ol>
          <li>Submit your refund request with order details</li>
          <li>Our team will review your request within 48 hours</li>
          <li>If approved, refund will be processed to original payment method</li>
          <li>Refund may take 5-7 working days to reflect in your account</li>
        </ol>

        <h2>Non-Refundable Cases</h2>
        <ul>
          <li>Products matching provided specifications</li>
          <li>Customization errors from customer's end</li>
          <li>Orders cancelled after production begins</li>
          <li>Normal wear and tear</li>
        </ul>

        <h2>Contact Us</h2>
        <p>For any queries regarding refunds, please contact our customer service team with your order details.</p>
      </div>
    </div>
  );
};

export default RefundPolicy;
