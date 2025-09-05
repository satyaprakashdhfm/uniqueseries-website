import React, { useState, useEffect } from 'react';
import './WhatsAppManager.css';

const WhatsAppManager = () => {
  const [whatsappStatus, setWhatsappStatus] = useState({
    isReady: false,
    adminPhone: '',
    qrCode: null,
    loading: false,
    message: ''
  });
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');

  // Check WhatsApp status
  const checkStatus = async () => {
    try {
      setWhatsappStatus(prev => ({ ...prev, loading: true }));
      const response = await fetch('/api/notifications/whatsapp/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      
      setWhatsappStatus(prev => ({
        ...prev,
        isReady: data.isReady,
        adminPhone: data.adminPhone,
        message: data.message,
        loading: false
      }));
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
      setWhatsappStatus(prev => ({
        ...prev,
        loading: false,
        message: 'Error checking status'
      }));
    }
  };

  // Get QR code
  const getQRCode = async () => {
    try {
      setWhatsappStatus(prev => ({ ...prev, loading: true }));
      const response = await fetch('/api/notifications/whatsapp/qrcode', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      
      console.log('QR Code Response:', data); // Debug log
      
      setWhatsappStatus(prev => ({
        ...prev,
        qrCode: data.qrCode || null,
        isReady: data.isReady,
        adminPhone: data.adminPhone,
        message: data.message,
        loading: false
      }));

      // If not ready and no QR code, auto-refresh
      if (!data.isReady && !data.qrCode) {
        setTimeout(() => {
          getQRCode();
        }, 2000);
      }
    } catch (error) {
      console.error('Error getting QR code:', error);
      setWhatsappStatus(prev => ({
        ...prev,
        loading: false,
        message: 'Error getting QR code'
      }));
    }
  };

  // Initialize WhatsApp
  const initializeWhatsApp = async () => {
    try {
      setWhatsappStatus(prev => ({ ...prev, loading: true }));
      const response = await fetch('/api/notifications/whatsapp/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      setWhatsappStatus(prev => ({
        ...prev,
        message: data.message,
        loading: false
      }));

      // Start polling for QR code
      setTimeout(() => {
        getQRCode();
      }, 1000);
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
      setWhatsappStatus(prev => ({
        ...prev,
        loading: false,
        message: 'Error initializing WhatsApp'
      }));
    }
  };

  // Test WhatsApp message
  const testWhatsApp = async () => {
    if (!testPhone) {
      alert('Please enter a phone number');
      return;
    }

    try {
      const response = await fetch('/api/notifications/test/whatsapp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneNumber: testPhone })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Test message sent successfully!');
        setTestPhone('');
      } else {
        alert(`Failed to send message: ${data.message}`);
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      alert('Error sending test message');
    }
  };

  // Send custom message
  const sendCustomMessage = async () => {
    if (!testPhone || !testMessage) {
      alert('Please enter both phone number and message');
      return;
    }

    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'whatsapp',
          recipient: testPhone,
          notificationType: 'custom',
          data: { message: testMessage }
        })
      });
      const data = await response.json();
      
      if (data.success && data.results.whatsapp.success) {
        alert('Custom message sent successfully!');
        setTestPhone('');
        setTestMessage('');
      } else {
        alert(`Failed to send message: ${data.results?.whatsapp?.error || data.message}`);
      }
    } catch (error) {
      console.error('Error sending custom message:', error);
      alert('Error sending custom message');
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Auto-refresh status every 10 seconds when not connected
    const statusInterval = setInterval(() => {
      if (!whatsappStatus.isReady) {
        checkStatus();
      }
    }, 10000);
    
    // Auto-refresh QR code every 15 seconds when QR is visible
    const qrInterval = setInterval(() => {
      if (!whatsappStatus.isReady && whatsappStatus.qrCode) {
        getQRCode();
      }
    }, 15000);

    return () => {
      clearInterval(statusInterval);
      clearInterval(qrInterval);
    };
  }, [whatsappStatus.isReady, whatsappStatus.qrCode]);

  return (
    <div className="whatsapp-manager">
      <h2>📱 WhatsApp Management</h2>
      
      <div className="status-section">
        <h3>Status</h3>
        <div className={`status-indicator ${whatsappStatus.isReady ? 'ready' : 'not-ready'}`}>
          <span className="status-dot"></span>
          <span>{whatsappStatus.isReady ? 'Connected & Ready' : 'Not Connected'}</span>
        </div>
        
        {whatsappStatus.adminPhone && (
          <p className="admin-phone">
            <strong>Admin Phone:</strong> {whatsappStatus.adminPhone}
          </p>
        )}
        
        {whatsappStatus.message && (
          <p className="status-message">{whatsappStatus.message}</p>
        )}
        
        <div className="action-buttons">
          <button onClick={checkStatus} disabled={whatsappStatus.loading}>
            {whatsappStatus.loading ? 'Checking...' : 'Refresh Status'}
          </button>
          
          {!whatsappStatus.isReady && (
            <>
              <button onClick={initializeWhatsApp} disabled={whatsappStatus.loading}>
                {whatsappStatus.loading ? 'Initializing...' : 'Initialize WhatsApp'}
              </button>
              <button onClick={getQRCode} disabled={whatsappStatus.loading}>
                {whatsappStatus.loading ? 'Loading...' : 'Get QR Code'}
              </button>
            </>
          )}
        </div>
      </div>

      {!whatsappStatus.isReady && whatsappStatus.qrCode && (
        <div className="qr-section">
          <h3>📱 Scan QR Code to Connect WhatsApp</h3>
          <div className="qr-instructions">
            <p><strong>📋 Step-by-step Instructions:</strong></p>
            <ol>
              <li>Open <strong>WhatsApp</strong> on your phone: <strong>9381502998</strong></li>
              <li>Tap the <strong>three dots (⋮)</strong> in the top right corner</li>
              <li>Select <strong>"Linked Devices"</strong></li>
              <li>Tap <strong>"Link a Device"</strong></li>
              <li>Point your camera at the QR code below</li>
              <li>Wait for connection confirmation</li>
            </ol>
            <p style={{color: '#666', fontSize: '14px', marginTop: '10px'}}>
              ⏰ QR code expires in 20 seconds. It will auto-refresh if needed.
            </p>
          </div>
          
          <div className="qr-code-container">
            <img src={whatsappStatus.qrCode} alt="WhatsApp QR Code" className="qr-code" />
          </div>
          
          <div style={{display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap'}}>
            <button onClick={getQRCode} className="refresh-qr">
              🔄 Refresh QR Code
            </button>
            <button onClick={checkStatus} className="refresh-qr" style={{backgroundColor: '#28a745'}}>
              ✅ Check Connection
            </button>
          </div>
        </div>
      )}

      {!whatsappStatus.isReady && !whatsappStatus.qrCode && (
        <div className="qr-section">
          <h3>🚀 Initialize WhatsApp First</h3>
          <p style={{textAlign: 'center', color: '#666', marginBottom: '20px'}}>
            WhatsApp needs to be initialized before you can get the QR code.
          </p>
          <div style={{textAlign: 'center'}}>
            <button onClick={initializeWhatsApp} disabled={whatsappStatus.loading} style={{
              padding: '15px 30px',
              fontSize: '16px',
              backgroundColor: '#25d366',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              {whatsappStatus.loading ? 'Initializing...' : '🚀 Initialize WhatsApp'}
            </button>
          </div>
        </div>
      )}

      {/* Debug section - remove this after testing */}
      <div style={{
        background: '#f8f9fa',
        padding: '15px',
        borderRadius: '5px',
        marginTop: '20px',
        fontSize: '12px',
        fontFamily: 'monospace'
      }}>
        <strong>Debug Info:</strong>
        <br />
        isReady: {String(whatsappStatus.isReady)}
        <br />
        hasQRCode: {String(!!whatsappStatus.qrCode)}
        <br />
        message: {whatsappStatus.message}
        <br />
        loading: {String(whatsappStatus.loading)}
      </div>

      {whatsappStatus.isReady && (
        <div className="success-section">
          <div className="success-message">
            <h3>🎉 WhatsApp Successfully Connected!</h3>
            <p>Your WhatsApp is now connected and ready to send notifications.</p>
            <p><strong>Connected Phone:</strong> {whatsappStatus.adminPhone}</p>
          </div>
          
          <div className="test-section">
            <h3>🧪 Test WhatsApp Messaging</h3>
            
            <div className="test-form">
              <div className="form-group">
                <label>Phone Number:</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Enter phone number (e.g., 9876543210)"
                  className="form-input"
                />
              </div>
              
              <button onClick={testWhatsApp} className="test-btn">
                📤 Send Test Message
              </button>
            </div>

            <div className="custom-message-form">
              <h4>📝 Send Custom Message</h4>
              <div className="form-group">
                <label>Message:</label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter your custom message..."
                  className="form-textarea"
                  rows="3"
                />
              </div>
              
              <button onClick={sendCustomMessage} className="send-btn">
                🚀 Send Custom Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppManager;
