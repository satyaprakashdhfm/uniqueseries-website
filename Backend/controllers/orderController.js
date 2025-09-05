const { Cart, Order, OrderItem, Product, Payment, User, Coupon } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');
const emailService = require('../config/email');
const whatsAppService = require('../config/whatsapp');

// Helpers
const slugifySafe = (val, fallback = '') => {
  const str = (val == null ? fallback : String(val)).toLowerCase();
  return str.replace(/[^a-z0-9-_]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
};
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const rnd = Math.floor(1000+Math.random()*9000);
  return `ORD${dateStr}${rnd}`;
};

// POST /api/orders (checkout)
exports.createOrder = async (req,res)=>{
  const t = await sequelize.transaction();
  try{
    const {
      customer_name, customer_email, customer_phone, shipping_address, coupon_code, payment_method='UPI'
    } = req.body;
    const email = req.user?.email || customer_email;
    if(!email){ await t.rollback(); return res.status(400).json({ message:'Email required' }); }

    const cartRows = await Cart.findAll({ where:{ user_email: email, is_checked_out:false }, transaction:t, lock:t.LOCK.UPDATE });
    if(cartRows.length===0){ await t.rollback(); return res.status(400).json({ message:'Cart empty' }); }

    // compute totals
    let subtotal = 0;
    for (const r of cartRows) {
      subtotal += Number(r.unit_price) * Number(r.quantity);
    }

    // ---------------- Coupon validation ----------------
    let discount = 0;
    let couponRow = null;
    if (coupon_code) {
      const now = new Date();
      const code = String(coupon_code).toUpperCase();
      couponRow = await Coupon.findOne({
        where: {
          code,
          is_active: true,
          expiry_date: { [Op.gte]: now },
          [Op.or]: [
            { usage_limit: null },
            { times_used: { [Op.lt]: sequelize.col('usage_limit') } }
          ]
        },
        transaction: t,
        lock: t.LOCK.UPDATE
      });

      if (couponRow) {
        if (couponRow.type === 'percentage') {
          discount = Math.round(subtotal * Number(couponRow.discount_value) / 100);
        } else {
          discount = Math.min(subtotal, Number(couponRow.discount_value));
        }

        // increment times_used
        couponRow.times_used += 1;
        await couponRow.save({ transaction: t });
      }
    }

    const shipping_fee = subtotal - discount > 999 ? 0 : 68;
    const total_amount = Math.round((subtotal-discount+shipping_fee)*100)/100;

    // payment row
    const payment_id = 'PAY'+Date.now()+Math.floor(Math.random()*1000);
    const upi_reference_id = 'UPI'+Date.now();
    // DEV: auto-complete payment to avoid manual verification
    const paymentRecord = await Payment.create({ payment_id, user_email:email, payment_method, payment_status:'completed', payment_amount:total_amount, upi_reference_id }, { transaction:t });

    // order row (aggregate)
    const order_number = generateOrderNumber();
    const cart_number = cartRows[0].cart_number;
    await Order.create({ order_number, cart_number, user_email:email, customer_name, customer_email:email, customer_phone, shipping_address, total_amount, order_status:'confirmed', payment_id, coupon_code:coupon_code||null, discount_amount:discount }, { transaction:t });

    // order_items rows
    for (const row of cartRows) {
      await OrderItem.create({
        order_number,
        product_name: row.product_name,
        quantity: row.quantity,
        unit_price: row.unit_price,
        total_price: Number(row.unit_price) * Number(row.quantity),
        custom_photo_url: row.custom_photo_url,
        datewith_instructions: row.datewith_instructions
      }, { transaction: t });

      row.is_checked_out = true;
      await row.save({ transaction: t });
    }

    await t.commit();
    
    // Send order confirmation notifications ONLY if payment is successful
    if (paymentRecord.payment_status === 'completed') {
      try {
        const orderDetails = {
          orderId: order_number,
          customerName: customer_name,
          totalAmount: total_amount,
          orderDate: new Date(),
          items: cartRows.map(row => ({
            productName: row.product_name,
            quantity: row.quantity,
            price: Number(row.unit_price) * Number(row.quantity)
          }))
        };

        // Send email notification
        await emailService.sendOrderConfirmationEmail(email, orderDetails);
        console.log(`✅ Order confirmation email sent to ${email}`);
        
        // Send WhatsApp notification if phone number provided and WhatsApp is ready
        if (customer_phone && whatsAppService.isClientReady()) {
          await whatsAppService.sendOrderConfirmation(customer_phone, orderDetails);
          console.log(`✅ Order confirmation WhatsApp sent to ${customer_phone}`);
        }
      } catch (notificationError) {
        console.error('Failed to send order confirmation notifications:', notificationError);
        // Don't fail the order creation if notification fails
      }
    } else {
      console.log(`⏳ Payment not completed yet. Notifications will be sent when payment is confirmed.`);
    }
    
    res.status(201).json({ order_number, total_amount, payment_id, upi_reference_id, subtotal, discount, shipping_fee });
  }catch(err){
    await t.rollback();
    console.error(err);
    res.status(500).json({ message: err.message||'Server error' });
  }
};

// GET /api/orders/:id
exports.getOrderById = async (req,res)=>{
  try{
    const { id } = req.params;
    const order = await Order.findOne({ where:{ order_number:id }, include:[{ model: Payment, as:'payment' }] });
    if(!order) return res.status(404).json({ message:'Order not found' });
    const itemsRaw = await OrderItem.findAll({ where:{ order_number:id }, include:[{ model: Product, as:'product', attributes:['price'] }] });
    const items = itemsRaw.map((it)=>{
      const obj = it.toJSON();
      const base = obj.product?.price != null ? Number(obj.product.price) : Number(obj.unit_price);
      const unit = Number(obj.unit_price);
      const totalExtras = unit - base;
      return {
        ...obj,
        price_breakdown:{
          base,
          extras: totalExtras>0 ? [{ label:'Extras', cost: totalExtras }] : [],
          totalExtras: totalExtras>0 ? totalExtras : 0
        }
      };
    });
    res.json({ ...order.toJSON(), items });
  }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};

// GET /api/orders/user
exports.getUserOrders = async (req,res)=>{
  try{
    const email = req.user.email;
    const orders = await Order.findAll({ where:{ user_email:email }, order:[['created_at','DESC']] });
    const withItems = await Promise.all(orders.map(async(o)=>{
      const rawItems = await OrderItem.findAll({ where:{ order_number:o.order_number }, include:[{ model: Product, as:'product', attributes:['price'] }] });
      const items = rawItems.map((it)=>{
        const obj = it.toJSON();
        const base = obj.product?.price != null ? Number(obj.product.price) : Number(obj.unit_price);
        const unit = Number(obj.unit_price);
        const totalExtras = unit - base;
        return {
          ...obj,
          price_breakdown:{
            base,
            extras: totalExtras>0 ? [{ label:'Extras', cost: totalExtras }] : [],
            totalExtras: totalExtras>0 ? totalExtras : 0
          }
        };
      });
      return { ...o.toJSON(), items };
    }));
    res.json(withItems);
  }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};

// GET /api/orders/:orderNumber/payment
exports.getUpiPaymentDetails = async (req,res)=>{
  try{ const { orderNumber } = req.params; const order = await Order.findOne({ where:{ order_number:orderNumber } }); if(!order) return res.status(404).json({ message:'Order not found' }); const payment = await Payment.findOne({ where:{ payment_id: order.payment_id } }); if(!payment) return res.status(404).json({ message:'Payment not found' }); res.json({ merchantVpa: process.env.UPI_MERCHANT_VPA || 'merchant@bank', merchantName:'Currency Gift Store', amount: payment.payment_amount, referenceId: payment.upi_reference_id, currency:'INR' }); }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};

// POST /api/orders/:orderNumber/confirm-payment
exports.confirmPayment = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { payment_status, transaction_id } = req.body;

    // Find the order
    const order = await Order.findOne({ 
      where: { order_number: orderNumber },
      include: [{ model: Payment, as: 'payment' }]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Update payment status
    const payment = await Payment.findOne({ where: { payment_id: order.payment_id } });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const previousStatus = payment.payment_status;
    payment.payment_status = payment_status;
    if (transaction_id) {
      payment.upi_reference_id = transaction_id;
    }
    await payment.save();

    // If payment is now successful and wasn't before, send notifications
    if (payment_status === 'completed' && previousStatus !== 'completed') {
      try {
        // Get order items for notification
        const orderItems = await OrderItem.findAll({ where: { order_number: orderNumber } });
        
        const orderDetails = {
          orderId: order.order_number,
          customerName: order.customer_name,
          totalAmount: order.total_amount,
          orderDate: order.created_at,
          items: orderItems.map(item => ({
            productName: item.product_name,
            quantity: item.quantity,
            price: item.total_price
          }))
        };

        // Send email notification
        await emailService.sendOrderConfirmationEmail(order.customer_email, orderDetails);
        console.log(`✅ Payment confirmed - Order confirmation email sent to ${order.customer_email}`);
        
        // Send WhatsApp notification if phone number provided and WhatsApp is ready
        if (order.customer_phone && whatsAppService.isClientReady()) {
          await whatsAppService.sendOrderConfirmation(order.customer_phone, orderDetails);
          console.log(`✅ Payment confirmed - Order confirmation WhatsApp sent to ${order.customer_phone}`);
        }

        // Update order status to confirmed if it wasn't already
        if (order.order_status !== 'confirmed') {
          order.order_status = 'confirmed';
          await order.save();
        }

      } catch (notificationError) {
        console.error('Failed to send payment confirmation notifications:', notificationError);
        // Don't fail the payment confirmation if notification fails
      }
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      payment_status: payment.payment_status,
      order_status: order.order_status
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/orders/verify-payment
exports.verifyUpiPayment = async (req,res)=>{
  try{ const { orderNumber, transactionId, status } = req.body; const order = await Order.findOne({ where:{ order_number:orderNumber } }); if(!order) return res.status(404).json({ message:'Order not found' }); const payment = await Payment.findOne({ where:{ payment_id: order.payment_id } }); if(!payment) return res.status(404).json({ message:'Payment not found' }); payment.upi_transaction_id = transactionId; payment.payment_status = status==='SUCCESS'?'completed':'failed'; await payment.save(); order.order_status = status==='SUCCESS'?'confirmed':'pending'; await order.save(); res.json({ success:true, payment_status: payment.payment_status, order_status: order.order_status }); }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};