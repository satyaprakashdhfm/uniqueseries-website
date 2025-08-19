const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  order_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'orders',
      key: 'order_number'
    }
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: 'products',
      key: 'name'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  custom_photo_url: {
    type: DataTypes.STRING(500)
  },
  datewith_instructions: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = OrderItem;