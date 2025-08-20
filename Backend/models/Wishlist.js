const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Wishlist = sequelize.define('Wishlist', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: 'users',
      key: 'email'
    }
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: 'products',
      key: 'name'
    }
  }
}, {
  tableName: 'wishlist',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Wishlist;
