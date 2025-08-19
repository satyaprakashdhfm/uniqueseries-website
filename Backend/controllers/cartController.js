const { Order, Product, User } = require('../models');

// Generate a unique CART order number per item
const generateCartOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `CART-${dateStr}-${rand}`;
};

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res) => {
  try {
    const cartOrders = await Order.findAll({
      where: {
        customer_email: req.user.email,
        order_status: 'pending',
        payment_status: 'pending'
      },
      include: [{ model: Product, as: 'product', attributes: ['name', 'price', 'w_days'] }],
      order: [['created_at', 'ASC']]
    });

    // Map to maintain compatibility with frontend expecting item.Product and item.id
    const response = cartOrders.map((o) => {
      const json = o.toJSON();
      return {
        ...json,
        id: json.order_number,
        productName: json.product_name,
        quantity: json.quantity,
        // expose Product in PascalCase for frontend CartContext
        Product: json.product ? {
          name: json.product.name,
          price: json.product.price,
          w_days: json.product.w_days
        } : undefined
      };
    });

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res) => {
  try {
    const { productName, quantity, customization } = req.body;
    const userEmail = req.user.email;

    // Derive a stable custom photo reference
    // Prefer explicit customization.custom_photo_url; else first imageUrls; else folder path
    let customPhotoUrl = customization?.custom_photo_url || null;
    if (!customPhotoUrl) {
      const imgs = Array.isArray(customization?.imageUrls)
        ? customization.imageUrls.filter(Boolean)
        : (customization?.imageUrl ? [customization.imageUrl] : []);
      const folder = customization?.folder || '';
      customPhotoUrl = imgs[0] || (folder || null);
    }
    // Pass-through instructions if provided by client (frontend builds summary text)
    const datewithInstructions = customization?.datewith_instructions || null;

    // Check if product exists
    const product = await Product.findByPk(productName);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Try to hydrate user info for placeholders
    let customerName = req.user?.name || req.user?.email || 'Guest';
    let customerPhone = req.user?.phone || 'N/A';
    let shippingAddress = req.user?.address || 'TBD';
    try {
      if (!req.user?.name || !req.user?.address || !req.user?.phone) {
        const u = await User.findOne({ where: { email: userEmail } });
        if (u) {
          customerName = u.name || customerName;
          customerPhone = u.phone || customerPhone;
          shippingAddress = u.address || shippingAddress;
        }
      }
    } catch (_) {}

    // Find existing pending cart row with same product and same customization fields
    const existing = await Order.findOne({
      where: {
        customer_email: userEmail,
        order_status: 'pending',
        payment_status: 'pending',
        product_name: productName,
        custom_photo_url: customPhotoUrl,
        datewith_instructions: datewithInstructions
      }
    });

    if (existing) {
      existing.quantity = (existing.quantity || 0) + (quantity || 1);
      existing.unit_price = product.price; // ensure price consistency
      existing.order_amount = (Number(existing.unit_price) || 0) * (existing.quantity || 1);
      await existing.save();
      return res.json({
        ...existing.toJSON(),
        id: existing.order_number
      });
    }

    const order_number = generateCartOrderNumber();
    const unit_price = product.price;
    const qty = quantity || 1;
    const order_amount = (Number(unit_price) || 0) * qty;

    const created = await Order.create({
      order_number,
      customer_name: customerName,
      customer_email: userEmail,
      customer_phone: customerPhone,
      shipping_address: shippingAddress,
      product_name: productName,
      quantity: qty,
      unit_price,
      order_amount,
      custom_photo_url: customPhotoUrl,
      datewith_instructions: datewithInstructions,
      order_status: 'pending',
      payment_status: 'pending'
    });

    res.status(201).json({
      ...created.toJSON(),
      id: created.order_number
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { id } = req.params;
    const userEmail = req.user.email;

    const orderRow = await Order.findOne({
      where: {
        order_number: id,
        customer_email: userEmail,
        order_status: 'pending',
        payment_status: 'pending'
      }
    });

    if (!orderRow) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    if (quantity <= 0) {
      await orderRow.destroy();
      return res.json({ message: 'Cart item removed' });
    }

    orderRow.quantity = quantity;
    // Recalculate order_amount
    const unit = Number(orderRow.unit_price) || 0;
    orderRow.order_amount = unit * Number(quantity);
    await orderRow.save();
    res.json({ ...orderRow.toJSON(), id: orderRow.order_number });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
exports.removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;

    const orderRow = await Order.findOne({
      where: {
        order_number: id,
        customer_email: userEmail,
        order_status: 'pending',
        payment_status: 'pending'
      }
    });

    if (!orderRow) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await orderRow.destroy();
    res.json({ message: 'Cart item removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Clear user's cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res) => {
  try {
    const userEmail = req.user.email;
    await Order.destroy({
      where: {
        customer_email: userEmail,
        order_status: 'pending',
        payment_status: 'pending'
      }
    });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};