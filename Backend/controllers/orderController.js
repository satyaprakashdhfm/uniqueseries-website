const { Order, Product } = require('../models');
const { sequelize } = require('../config/db');
const { cloudinary } = require('../config/cloudinary');

// Helper to create safe slugs for folder names
const slugifySafe = (val, fallback = '') => {
  const str = (val == null ? fallback : String(val)).toLowerCase();
  return str
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Move all assets from a Cloudinary folder to another folder (by renaming public IDs)
const moveFolderAssets = async (fromFolder, toFolder) => {
  const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
  if (!hasCloudinary) return;
  try {
    const result = await cloudinary.api.resources({ type: 'upload', prefix: `${fromFolder}/`, max_results: 200 });
    const resources = result.resources || [];
    await Promise.all(resources.map(async (r) => {
      const parts = (r.public_id || '').split('/');
      const base = parts[parts.length - 1];
      const toPublicId = `${toFolder}/${base}`;
      try {
        await cloudinary.uploader.rename(r.public_id, toPublicId, { overwrite: true });
      } catch (err) {
        console.error('[Cloudinary] rename failed:', r.public_id, '->', toPublicId, err?.message || err);
      }
    }));
  } catch (err) {
    console.error('[Cloudinary] list/rename failed for folder:', fromFolder, err?.message || err);
  }
};

// Generate a unique reference ID for UPI payment
const generateReferenceId = () => {
  return 'UPI' + Date.now() + Math.floor(Math.random() * 1000);
};

// Generate order number function
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `ORD${dateStr}${randomNum}`;
};

// Create a new order from pending order rows (cart)
exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      coupon_code
    } = req.body;

    const effectiveCustomerEmail = (req.user && req.user.email) ? req.user.email : (customer_email || null);
    if (!effectiveCustomerEmail) {
      await t.rollback();
      return res.status(401).json({ message: 'Authentication required to place order' });
    }

    // Use existing pending orders as cart rows
    const cartItems = await Order.findAll({
      where: {
        customer_email: effectiveCustomerEmail,
        order_status: 'pending',
        payment_status: 'pending'
      },
      transaction: t
    });

    if (cartItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // ... (rest of the function remains the same until after order creation)
    const upi_reference_id = generateReferenceId();
    const order_number = generateOrderNumber();
    let subtotal = 0;

    for (const item of cartItems) {
        const product = await Product.findByPk(item.product_name, { transaction: t });
        if (!product) {
            throw new Error(`Product ${item.product_name} not found`);
        }
        if (!product.is_available) {
            throw new Error(`Product ${item.product_name} is not available`);
        }
        // Prefer unit_price already stored on row; fallback to product.price
        const unitPrice = item.unit_price != null ? parseFloat(item.unit_price) : parseFloat(product.price);
        subtotal += unitPrice * parseInt(item.quantity);
    }

    let discount = 0;
    let appliedCoupon = null;
    if (coupon_code && String(coupon_code).trim()) {
      const code = String(coupon_code).trim();
      const [rows] = await sequelize.query(
        `UPDATE coupons
         SET times_used = times_used + 1, updated_at = NOW()
         WHERE code = :code
           AND is_active = true
           AND (expiry_date IS NULL OR expiry_date > NOW())
           AND (usage_limit IS NULL OR times_used < usage_limit)
         RETURNING code, type, discount_value;`,
        { replacements: { code }, transaction: t }
      );
      if (!rows || rows.length === 0) {
        await t.rollback();
        return res.status(400).json({ message: 'Invalid or expired coupon, or usage limit reached' });
      }
      appliedCoupon = rows[0];
      const dv = Number(appliedCoupon.discount_value) || 0;
      if ((appliedCoupon.type || '').toLowerCase() === 'percentage') {
        discount = Math.max(0, subtotal * (dv / 100));
      } else if ((appliedCoupon.type || '').toLowerCase() === 'fixed_amount') {
        discount = Math.max(0, dv);
      }
      if (discount > subtotal) discount = subtotal;
      discount = Math.round(discount * 100) / 100;
    }

    const postDiscountSubtotal = Math.max(0, subtotal - discount);
    const shipping_fee = postDiscountSubtotal > 999 ? 0 : 68;
    const finalTotal = Math.round((postDiscountSubtotal + shipping_fee) * 100) / 100;

    // Consolidate all pending rows into a single order_number and finalize statuses
    const userSlug = slugifySafe(effectiveCustomerEmail || customer_name || 'guest');
    for (const item of cartItems) {
      const product = await Product.findByPk(item.product_name, { transaction: t });
      const unitPrice = item.unit_price != null ? parseFloat(item.unit_price) : parseFloat(product.price);
      const productSlug = slugifySafe(item.product_name);
      // Keep existing custom_photo_url if present

      await item.update({
        order_number,
        customer_name: customer_name || item.customer_name || effectiveCustomerEmail,
        customer_email: effectiveCustomerEmail,
        customer_phone: customer_phone || item.customer_phone || 'N/A',
        shipping_address: shipping_address || item.shipping_address || 'TBD',
        product_name: item.product_name,
        quantity: parseInt(item.quantity),
        unit_price: unitPrice,
        // Keep existing custom_photo_url as-is
        datewith_instructions: item.datewith_instructions || '',
        order_amount: finalTotal,
        upi_reference_id,
        order_status: 'confirmed',
        payment_status: 'completed'
      }, { transaction: t });

      // Handle custom photo folder move and URL update
      if (item.custom_photo_folder) { // Assuming custom_photo_folder is sent with the cart item
        const tempCloudinaryFolder = item.custom_photo_folder; // e.g., currency-gift/users/guest/pending/product-12345
        const finalCloudinaryFolder = `currency-gift/orders/${order_number}`; // e.g., currency-gift/orders/ORD202508191234

        // Move assets from temporary folder to final order folder
        await moveFolderAssets(tempCloudinaryFolder, finalCloudinaryFolder);

        // Construct the new custom_photo_url (folder URL)
        const cloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const finalCustomPhotoFolderUrl = `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/${finalCloudinaryFolder}/`;

        // Update the custom_photo_url in the database for this item
        await item.update({ custom_photo_url: finalCustomPhotoFolderUrl }, { transaction: t });
      }
    }

    await t.commit();

    // No folder move for cart rows stored in orders table (this comment is now outdated, but keeping for context)

    res.status(201).json({
      order_number,
      order_numbers: [order_number],
      upi_reference_id,
      order_amount: finalTotal,
      subtotal,
      discount,
      shipping_fee,
      applied_coupon: appliedCoupon ? appliedCoupon.code : null,
      message: 'Order created successfully'
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Get order by order_number with aggregated items
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await sequelize.query(`
      SELECT 
        o.order_number,
        MIN(o.customer_name)        AS customer_name,
        MIN(o.customer_email)       AS customer_email,
        MIN(o.customer_phone)       AS customer_phone,
        MIN(o.shipping_address)     AS shipping_address,
        MIN(o.order_amount)         AS order_amount,
        MIN(o.payment_status)       AS payment_status,
        MIN(o.upi_reference_id)     AS upi_reference_id,
        MIN(o.created_at)           AS created_at,
        JSON_AGG(JSON_BUILD_OBJECT(
          'product_name', o.product_name,
          'quantity',     o.quantity,
          'unit_price',   o.unit_price,
          'custom_photo_url', o.custom_photo_url,
          'datewith_instructions', o.datewith_instructions
        ) ORDER BY o.created_at ASC) AS items
      FROM orders o
      WHERE o.order_number = :orderNumber
      GROUP BY o.order_number
      LIMIT 1;
    `, { replacements: { orderNumber: id } });

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get UPI payment details for an order
// Get UPI payment details for an order
exports.getUpiPaymentDetails = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    const order = await Order.findOne({ where: { order_number: orderNumber } });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const upiPaymentInfo = {
      merchantId: process.env.UPI_MERCHANT_ID || 'DUMMY_MERCHANT_ID',
      merchantVpa: process.env.UPI_MERCHANT_VPA || 'merchant@bank',
      merchantName: 'Currency Gift Store',
      transactionNote: `Payment for order ${order.order_number}`,
      amount: order.order_amount,
      referenceId: order.upi_reference_id,
      currency: 'INR'
    };
    
    res.json(upiPaymentInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Verify UPI payment for an order
exports.verifyUpiPayment = async (req, res) => {
  try {
    const { orderNumber, transactionId, status } = req.body;
    
    const order = await Order.findOne({ where: { order_number: orderNumber } });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.upi_transaction_id = transactionId;
    order.payment_status = status === 'SUCCESS' ? 'completed' : 'failed';
    order.order_status = status === 'SUCCESS' ? 'confirmed' : 'pending';
    
    await order.save();
    
    res.json({
      success: true,
      order_number: order.order_number,
      payment_status: order.payment_status,
      order_status: order.order_status
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get orders by user, grouped by order_number with aggregated items
exports.getUserOrders = async (req, res) => {
  try {
    const email = req.user.email;
    const [rows] = await sequelize.query(`
      SELECT 
        o.order_number,
        MIN(o.customer_name)        AS customer_name,
        MIN(o.customer_email)       AS customer_email,
        MIN(o.customer_phone)       AS customer_phone,
        MIN(o.shipping_address)     AS shipping_address,
        MIN(o.order_amount)         AS order_amount,
        MIN(o.payment_status)       AS payment_status,
        MIN(o.upi_reference_id)     AS upi_reference_id,
        MIN(o.created_at)           AS created_at,
        JSON_AGG(JSON_BUILD_OBJECT(
          'product_name', o.product_name,
          'quantity',     o.quantity,
          'unit_price',   o.unit_price,
          'custom_photo_url', o.custom_photo_url,
          'datewith_instructions', o.datewith_instructions
        ) ORDER BY o.created_at ASC) AS items
      FROM orders o
      WHERE o.customer_email = :email
      GROUP BY o.order_number
      ORDER BY MIN(o.created_at) DESC;
    `, { replacements: { email } });

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};