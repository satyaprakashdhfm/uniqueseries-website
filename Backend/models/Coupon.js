const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Coupon model maps to 'coupons' table
const Coupon = sequelize.define('Coupon', {
  code: {
    type: DataTypes.STRING(64),
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('percentage', 'fixed'),
    allowNull: false,
  },
  discount_value: {
    type: DataTypes.DECIMAL(10,2),
    allowNull: false,
  },
  expiry_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  usage_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  times_used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  },
}, {
  tableName: 'coupons',
  timestamps: true,
  underscored: true,
});

module.exports = Coupon;
