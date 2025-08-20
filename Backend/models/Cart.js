const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Product = require('./Product');

const Cart = sequelize.define('Cart', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  cart_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  user_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    references: {
      model: User,
      key: 'email'
    }
  },
  product_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    references: {
      model: Product,
      key: 'name'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  custom_photo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  datewith_instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_checked_out: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'cart',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Define associations
Cart.belongsTo(User, { 
  foreignKey: 'user_email',
  targetKey: 'email',
  as: 'user'
});

Cart.belongsTo(Product, { 
  foreignKey: 'product_name',
  targetKey: 'name',
  as: 'product'
});

module.exports = Cart;
