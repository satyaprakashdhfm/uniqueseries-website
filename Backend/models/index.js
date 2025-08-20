const User = require('./User');
const Product = require('./Product');
const Cart = require('./Cart');
const Order = require('./Order');
const Payment = require('./Payment');
const ProductReview = require('./ProductReview');
const Wishlist = require('./Wishlist');
const AdminUser = require('./AdminUser');
const ContactMessage = require('./ContactMessage');
const OrderItem = require('./OrderItem');

// Note: Removed User-Order association on user_email since the column does not exist in DB.
// This avoids Sequelize adding a non-existent 'user_email' attribute to RETURNING clauses.

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

// Order-Payment relationship
Order.belongsTo(Payment, {
  foreignKey: 'payment_id',
  targetKey: 'payment_id',
  as: 'payment'
});
Payment.hasMany(Order, {
  foreignKey: 'payment_id',
  sourceKey: 'payment_id',
  as: 'orders'
});

// Review associations
ProductReview.belongsTo(User, { foreignKey: 'user_email', targetKey: 'email', as: 'user' });
ProductReview.belongsTo(Product, { foreignKey: 'product_name', targetKey: 'name', as: 'product' });
User.hasMany(ProductReview, { foreignKey: 'user_email', sourceKey: 'email', as: 'reviews' });
Product.hasMany(ProductReview, { foreignKey: 'product_name', sourceKey: 'name', as: 'reviews' });

// Wishlist associations
Wishlist.belongsTo(User, { foreignKey: 'user_email', targetKey: 'email', as: 'user' });
Wishlist.belongsTo(Product, { foreignKey: 'product_name', targetKey: 'name', as: 'product' });
User.hasMany(Wishlist, { foreignKey: 'user_email', sourceKey: 'email', as: 'wishlist' });

// ContactMessage associations
ContactMessage.belongsTo(AdminUser, { foreignKey: 'assigned_to', targetKey: 'id', as: 'assignee' });
AdminUser.hasMany(ContactMessage, { foreignKey: 'assigned_to', sourceKey: 'id', as: 'assignedMessages' });

module.exports = {
  User,
  Product,
  Cart,
  Order,
  Payment,
  ProductReview,
  Wishlist,
  AdminUser,
  ContactMessage,
  OrderItem
};