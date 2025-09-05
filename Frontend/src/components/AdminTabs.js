import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WhatsAppManager from './WhatsAppManager';
import './AdminTabs.css';

const AdminTabs = ({ children }) => {
  const [activeTab, setActiveTab] = useState('orders');
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login', { replace: true });
  };

  const tabs = [
    { id: 'orders', label: '📦 Orders', icon: '📦' },
    { id: 'whatsapp', label: '📱 WhatsApp', icon: '📱' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return children; // This will be the original AdminDashboard content
      case 'whatsapp':
        return <WhatsAppManager />;
      default:
        return children;
    }
  };

  return (
    <div className="admin-page container">
      <div className="admin-header">
        <h2 className="admin-title">Admin Dashboard</h2>
        <button className="btn btn-outline" onClick={logout}>Logout</button>
      </div>

      <div className="admin-tabs">
        <div className="tab-navigation">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label.replace(/^\S+\s/, '')}</span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminTabs;
