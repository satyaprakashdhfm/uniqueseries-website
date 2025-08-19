import React, { useState } from 'react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="contact-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">Contact Us</h1>
          <p className="page-subtitle">
            Get in touch with us for any queries or custom requirements
          </p>
        </div>

        <div className="contact-content">
          <div className="contact-main-grid">
            {/* Small Get in Touch Component */}
            <div className="get-in-touch-small">
              <h2>Get In Touch</h2>
              <p className="contact-intro">
                We'd love to hear from you! Whether you have questions about our products, 
                need help finding a specific serial number, or want to discuss custom framing options, 
                our team is here to help.
              </p>

              <div className="contact-details-compact">
                <div className="contact-detail-compact">
                  <span className="contact-icon">📍</span>
                  <div>
                    <strong>Address</strong>
                    <p>Vijayawada, Andhra Pradesh, India</p>
                  </div>
                </div>

                <div className="contact-detail-compact">
                  <span className="contact-icon">📞</span>
                  <div>
                    <strong>Phone</strong>
                    <p>+91 9392464563</p>
                  </div>
                </div>

                <div className="contact-detail-compact">
                  <span className="contact-icon">✉️</span>
                  <div>
                    <strong>Email</strong>
                    <p>uniqueseries500@gmail.com</p>
                  </div>
                </div>


              </div>
            </div>

            {/* Medium Send us a Message Component */}
            <div className="contact-form-container">
              <form onSubmit={handleSubmit} className="contact-form">
                <h2>Send us a Message</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="subject">Subject *</label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="form-input"
                    >
                      <option value="">Select a subject</option>
                      <option value="product-inquiry">Product Inquiry</option>
                      <option value="custom-order">Custom Order</option>
                      <option value="support">Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows="5"
                    className="form-input"
                    placeholder="Tell us about your requirements or questions..."
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary submit-btn">
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-grid">
            <div className="faq-item">
              <h3>How do you find specific serial numbers?</h3>
              <p>We have a network of collectors and sources who help us find currency notes with specific dates and serial numbers.</p>
            </div>
            <div className="faq-item">
              <h3>Can I request a custom serial number?</h3>
              <p>Yes! We accept custom requests for specific dates. Please contact us with your requirements and we'll do our best to find it.</p>
            </div>
            <div className="faq-item">
              <h3>How long does delivery take?</h3>
              <p>Standard delivery takes 3-7 business days within India. Express delivery options are also available.</p>
            </div>
            <div className="faq-item">
              <h3>Do you offer international shipping?</h3>
              <p>Currently, we only ship within India. We're working on expanding to international markets soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
