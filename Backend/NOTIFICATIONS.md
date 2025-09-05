# Email and WhatsApp Notification System

This system provides automated email and WhatsApp notifications for your e-commerce application.

## Features

### 📧 Email Notifications
- Order confirmation emails
- Welcome emails for new users
- Contact form notifications to admin
- Custom email sending

### 📱 WhatsApp Notifications
- Order confirmation messages
- Welcome messages for new users
- Order status updates
- Custom message sending

## Setup Instructions

### 1. Install Dependencies

The required packages are already added to `package.json`. Run:

```bash
cd Backend
npm install
```

### 2. Email Configuration

#### For Gmail:
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. Add to your `.env` file:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
EMAIL_FROM_NAME=Currency Gift Store
ADMIN_EMAIL=admin@currencygiftstore.com
```

#### For Other Email Services:
Edit `config/email.js` and modify the transporter configuration:

```javascript
// For Outlook
service: 'outlook'

// For Yahoo
service: 'yahoo'

// For custom SMTP
host: 'smtp.yourdomain.com',
port: 587,
secure: false,
```

### 3. WhatsApp Configuration

#### Initial Setup:
1. Start your server
2. Make a POST request to `/api/notifications/whatsapp/initialize` (admin only)
3. Check your server console for a QR code
4. Scan the QR code with your phone using WhatsApp
5. WhatsApp will be authenticated and ready to send messages

#### Auto-initialization (Optional):
Add to your `.env` file to auto-start WhatsApp on server startup:

```env
AUTO_INIT_WHATSAPP=true
```

## API Endpoints

### General Notifications
- `POST /api/notifications/send` - Send email/WhatsApp notification
- `GET /api/notifications/whatsapp/status` - Check WhatsApp status (admin)
- `POST /api/notifications/whatsapp/initialize` - Initialize WhatsApp (admin)

### Test Endpoints
- `POST /api/notifications/test/email` - Send test email (admin)
- `POST /api/notifications/test/whatsapp` - Send test WhatsApp (admin)

### Payment Confirmation
- `POST /api/orders/:orderNumber/confirm-payment` - Confirm payment and send notifications

## Automatic Notifications

### When They're Sent:

1. **Order Confirmation**: Only sent when payment status is 'completed'
2. **Welcome Messages**: Sent immediately after successful user registration
3. **Contact Form**: Admin notification sent when contact form is submitted

### Notification Flow:

```
Order Creation → Payment Processing → Payment Confirmed → Notifications Sent
                                   ↓
                            Email + WhatsApp (if phone provided)
```

## Usage Examples

### 1. Send Custom Notification

```javascript
POST /api/notifications/send
{
  "type": "both", // 'email', 'whatsapp', or 'both'
  "recipient": "customer@email.com", // or phone number for WhatsApp
  "notificationType": "custom",
  "data": {
    "subject": "Custom Subject",
    "message": "Custom message content",
    "html": "<h1>Custom HTML content</h1>"
  }
}
```

### 2. Confirm Payment and Send Notifications

```javascript
POST /api/orders/ORD20250906123/confirm-payment
{
  "payment_status": "completed",
  "transaction_id": "TXN123456789"
}
```

### 3. Test Email

```javascript
POST /api/notifications/test/email
{
  "email": "test@example.com"
}
```

### 4. Test WhatsApp

```javascript
POST /api/notifications/test/whatsapp
{
  "phoneNumber": "+919876543210"
}
```

## Phone Number Format

WhatsApp automatically formats phone numbers:
- Indian numbers: `9876543210` or `+919876543210`
- International: Include country code

## Error Handling

- Notifications are non-blocking - if they fail, the main operation (order creation, user registration) still succeeds
- All notification errors are logged to console
- Failed notifications don't affect user experience

## Production Considerations

### Email:
- Use a dedicated SMTP service (SendGrid, Mailgun, etc.) for better deliverability
- Set proper SPF, DKIM, and DMARC records for your domain

### WhatsApp:
- WhatsApp Web session needs to stay active
- Consider using WhatsApp Business API for production
- Monitor the QR code session expiry

### Security:
- Keep your email credentials secure
- Use environment variables for all sensitive data
- Implement rate limiting for notification endpoints

## Troubleshooting

### Email Issues:
- Check if 2FA is enabled and app password is correct
- Verify SMTP settings for non-Gmail providers
- Check spam folder for test emails

### WhatsApp Issues:
- Ensure QR code is scanned properly
- Check if WhatsApp Web session is still active
- Restart WhatsApp service if connection is lost

### Common Errors:
- "WhatsApp client not ready" - Scan QR code first
- "Invalid recipients" - Check email/phone format
- "Authentication failed" - Verify email credentials

## File Structure

```
Backend/
├── config/
│   ├── email.js          # Email service configuration
│   └── whatsapp.js       # WhatsApp service configuration
├── controllers/
│   ├── notificationController.js  # Notification API endpoints
│   ├── orderController.js         # Updated with notifications
│   ├── authController.js          # Updated with welcome messages
│   └── contactController.js       # Updated with admin notifications
└── routes/
    └── notificationRoutes.js      # Notification routes
```

This system is designed to be reliable, scalable, and easy to maintain. Notifications enhance user experience without affecting core functionality.
