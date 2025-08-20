import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">About uniqueseries</h1>
          <p className="page-subtitle">
            Discover the story behind our unique collection of currency notes and frames
          </p>
        </div>

        <div className="about-content">
          <section className="story-section">
            <div className="story-content">
              <h2>Our Story</h2>
              <p>
                uniqueseries was born from a simple yet profound idea: every date has a story, 
                and every story deserves to be preserved. Founded in 2020 by a passionate collector 
                who discovered the magic of currency notes with special serial numbers, we've grown 
                into India's premier destination for meaningful gifts.
              </p>
              <p>
                What started as a hobby of collecting currency notes with birthdate serial numbers 
                has evolved into a business that helps thousands of people create lasting memories. 
                We believe that the most precious gifts are those that carry personal significance 
                and tell a unique story.
              </p>
            </div>
          </section>

          <section className="mission-section">
            <h2>Our Mission</h2>
            <div className="mission-grid">
              <div className="mission-item">
                <div className="mission-icon">🎯</div>
                <h3>Meaningful Gifts</h3>
                <p>To help people create meaningful connections through personalized currency notes and frames that celebrate special moments.</p>
              </div>
              <div className="mission-item">
                <div className="mission-icon">✨</div>
                <h3>Quality Craftsmanship</h3>
                <p>To provide premium quality frames and products that preserve memories beautifully for generations to come.</p>
              </div>
              <div className="mission-item">
                <div className="mission-icon">❤️</div>
                <h3>Customer Happiness</h3>
                <p>To ensure every customer receives not just a product, but a piece of joy that brings smiles and creates lasting memories.</p>
              </div>
            </div>
          </section>

          <section className="team-section">
            <h2>Our Commitment</h2>
            <div className="commitment-text">
              <p>
                At uniqueseries, we understand that behind every purchase is a story waiting to be told. 
                Whether it's a birthday, anniversary, graduation, or any special milestone, we're here to 
                help you commemorate those precious moments with something truly unique.
              </p>
              <p>
                Our team of dedicated professionals works tirelessly to source the finest currency notes 
                with meaningful serial numbers and create beautiful frames that will be treasured for years to come. 
                We're not just selling products; we're helping you create memories.
              </p>
            </div>
          </section>

          <section className="values-section">
            <h2>Why Choose Us?</h2>
            <div className="values-grid">
              <div className="value-item">
                <h3>🔍 Careful Selection</h3>
                <p>Each currency note is carefully selected and verified for authenticity and condition.</p>
              </div>
              <div className="value-item">
                <h3>🎨 Expert Craftsmanship</h3>
                <p>Our frames are crafted by skilled artisans using premium materials and techniques.</p>
              </div>
              <div className="value-item">
                <h3>🚚 Nationwide Delivery</h3>
                <p>We deliver across India with secure packaging to ensure your precious items reach safely.</p>
              </div>
              <div className="value-item">
                <h3>💬 Personal Service</h3>
                <p>Our team provides personalized assistance to help you find the perfect gift.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;
