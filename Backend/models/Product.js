const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Product = sequelize.define('Product', {
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('currency_note', 'photo_frame', 'resin_frame', 'zodiac_coin', 'zodiac'),
    allowNull: false
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  w_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 5
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'products',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Product;