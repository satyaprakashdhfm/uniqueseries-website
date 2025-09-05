import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <div className="footer">
            <p>
                By purchasing from this website, you agree to our{' '}
                <Link to="/terms">Terms & Conditions</Link>,{' '}
                <Link to="/privacy-policy">Privacy Policy</Link>,{' '}
                <Link to="/refund-policy">Refund Policy</Link>, and{' '}
                <Link to="/shipping-policy">Shipping Policy</Link>.
            </p>
        </div>
    );
};

export default Footer;
