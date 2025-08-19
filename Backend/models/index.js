const User = require('./User');
const Product = require('./Product');
const Cart = require('./Cart');
const Order = require('./Order');

// Note: Removed User-Order association on user_email since the column does not exist in DB.
// This avoids Sequelize adding a non-existent 'user_email' attribute to RETURNING clauses.

// Product-Order relationship
Order.belongsTo(Product, {
  foreignKey: 'product_name',
  targetKey: 'name',
  as: 'product'
});
Product.hasMany(Order, {
  foreignKey: 'product_name',
  sourceKey: 'name',
  as: 'orders'
});

// User-Order relationship via customer_email (aligns with DB column)
Order.belongsTo(User, {
  foreignKey: 'customer_email',
  targetKey: 'email',
  as: 'customer'
});
User.hasMany(Order, {
  foreignKey: 'customer_email',
  sourceKey: 'email',
  as: 'ordersByCustomer'
});

module.exports = {
  User,
  Product,
  Cart,
  Order
};