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
  userEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'email'
    }
  },
  productName: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: Product,
      key: 'name'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  customization: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  tableName: 'carts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

User.hasMany(Cart, { foreignKey: 'userEmail' });
Cart.belongsTo(User, { foreignKey: 'userEmail' });

Product.hasMany(Cart, { foreignKey: 'productName' });
Cart.belongsTo(Product, { foreignKey: 'productName' });

module.exports = Cart;
