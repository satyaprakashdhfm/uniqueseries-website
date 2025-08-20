const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Payment = sequelize.define('Payment', {
  payment_id: {
    type: DataTypes.STRING(255),
    primaryKey: true,
    allowNull: false
  },
  user_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    references: {
      model: 'users',
      key: 'email'
    }
  },
  payment_method: {
    type: DataTypes.ENUM('UPI', 'credit_card', 'debit_card', 'net_banking', 'wallet', 'cash_on_delivery'),
    defaultValue: 'UPI'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  payment_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'INR'
  },
  upi_transaction_id: {
    type: DataTypes.STRING(255)
  },
  upi_reference_id: {
    type: DataTypes.STRING(255)
  },
  gateway_transaction_id: {
    type: DataTypes.STRING(255)
  },
  gateway_response: {
    type: DataTypes.TEXT
  },
  payment_date: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'payments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Payment;
