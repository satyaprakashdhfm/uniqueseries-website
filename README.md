# Currency Gift Store 🎁

A premium e-commerce platform specializing in unique currency notes, custom frames, and collectibles for special occasions.

![Currency Gift Store](Frontend/public/assets/website_images/logo.png)

## 🌟 Features

### Products
- **Currency Notes**: Special serial number notes (₹1 to ₹500)
- **Framed Notes**: Premium frames with personalized touches
- **Resin Frames**: Modern 8x15" and 13x19" designs
- **Zodiac Coins**: Collectible zodiac-themed items

### Customer Experience
- 🛒 Intuitive shopping cart system
- 💳 Secure UPI payment integration
- 📱 WhatsApp order notifications
- ✉️ Email confirmations
- 🎨 Product customization options

### Admin Features
- 📊 Order management dashboard
- 📦 Product inventory control
- 🔔 WhatsApp integration for notifications
- 📈 Sales analytics and reporting

## 🚀 Tech Stack

### Frontend
- React.js
- Context API for state management
- CSS3 with modern animations
- Responsive design

### Backend
- Node.js & Express
- PostgreSQL with Sequelize ORM
- JWT authentication
- WhatsApp Web API integration
- Cloudinary for image management

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/currency-gift-store.git
cd currency-gift-store
```

2. Install dependencies:
```bash
# Install backend dependencies
cd Backend
npm install

# Install frontend dependencies
cd ../Frontend
npm install
```

3. Set up environment variables:
```bash
# Backend (.env)
cp Backend/.env.example Backend/.env

# Frontend (.env)
cp Frontend/.env_example Frontend/.env
```

4. Set up the database:
```bash
# Create PostgreSQL database and run migrations
psql -U postgres
CREATE DATABASE currency_gift_store;
\q

# Import schema
psql -U postgres currency_gift_store < database_schema/deploy.sql
```

5. Start the development servers:
```bash
# Start backend (http://localhost:3001)
cd Backend
npm run dev

# Start frontend (http://localhost:3000)
cd Frontend
npm start
```

## 🔧 Configuration

### Backend Configuration
- Database settings in `Backend/config/db.js`
- Email configuration in `Backend/config/email.js`
- WhatsApp settings in `Backend/config/whatsapp.js`
- UPI payment in `Backend/config/upi.js`

### Frontend Configuration
- API endpoints in `Frontend/src/services/api.js`
- Authentication context in `Frontend/src/context/AuthContext.js`
- Cart management in `Frontend/src/context/CartContext.js`

## 📱 Features & Screenshots

### Home Page
- Featured products showcase
- Special offers section
- About Us summary

### Product Pages
- Detailed product information
- Customization options
- Real-time price calculation

### User Dashboard
- Order history
- Profile management
- Saved addresses

## 🔒 Security Features

- JWT based authentication
- Secure payment processing
- Input validation & sanitization
- Protected API endpoints
- CORS configuration

## 📦 Deployment

The application is designed to be deployed on platforms like Railway or similar services:

```bash
# Build frontend
cd Frontend
npm run build

# Start production server
cd Backend
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Contact

- Website: uniqueseries.shop
- Email: uniqueseries500@gmail.com
- Phone: +91 9392464563
- Location: Vijayawada, Andhra Pradesh, India

---

Made with ❤️ by Kummitha Satya Prakash Reddy