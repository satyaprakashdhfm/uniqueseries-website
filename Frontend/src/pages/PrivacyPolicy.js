import React from 'react';
import './Policies.css';

const PrivacyPolicy = () => {
  return (
    <div className="policy-container">
      <h1>Privacy Policy</h1>
      <div className="policy-content">
        <h2>Information We Collect</h2>
        <p>When you use uniqueseries.shop, we collect the following types of information:</p>
        
        <h3>Personal Information</h3>
        <ul>
          <li>Name and contact details</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Shipping address</li>
          <li>Payment information (processed securely through our payment partners)</li>
        </ul>

        <h3>Custom Content</h3>
        <ul>
          <li>Photos uploaded for customization</li>
          <li>Personal messages for customized products</li>
          <li>Design preferences</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <ul>
          <li>Process and fulfill your orders</li>
          <li>Communicate about your order status</li>
          <li>Send shipping and delivery updates</li>
          <li>Provide customer support</li>
          <li>Improve our products and services</li>
        </ul>

        <h2>Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information:</p>
        <ul>
          <li>Secure SSL encryption for all transactions</li>
          <li>Secure storage of customer data</li>
          <li>Limited access to personal information</li>
          <li>Regular security audits</li>
        </ul>

        <h2>Third-Party Services</h2>
        <p>We use trusted third-party services for:</p>
        <ul>
          <li>Payment processing</li>
          <li>Shipping and delivery</li>
          <li>Email communications</li>
        </ul>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of marketing communications</li>
        </ul>

        <h2>Contact Us</h2>
        <p>For privacy-related concerns, please contact our data protection team.</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
