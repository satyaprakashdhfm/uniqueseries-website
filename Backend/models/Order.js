const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Order = sequelize.define('Order', {
  order_number: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    allowNull: false
  },
  customer_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  customer_email: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  customer_phone: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  order_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  custom_photo_url: {
    type: DataTypes.STRING(500)
  },
  datewith_instructions: {
    type: DataTypes.TEXT
  },
  order_status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  payment_id: {
    type: DataTypes.STRING(255)
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.STRING(50),
    defaultValue: 'UPI'
  },
  upi_transaction_id: {
    type: DataTypes.STRING(255)
  },
  upi_reference_id: {
    type: DataTypes.STRING(255)
  }
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Order;