const { Cart, Order, OrderItem, Product, Payment, User } = require('../models');
const { sequelize } = require('../config/db');
const { Op } = require('sequelize');

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
    let subtotal=0;
    for(const r of cartRows){ subtotal += Number(r.unit_price)*Number(r.quantity); }
    let discount=0;
    // TODO: apply coupon logic if needed (omitted for brevity)
    const shipping_fee = subtotal - discount > 999 ? 0 : 68;
    const total_amount = Math.round((subtotal-discount+shipping_fee)*100)/100;

    // payment row
    const payment_id = 'PAY'+Date.now()+Math.floor(Math.random()*1000);
    const upi_reference_id = 'UPI'+Date.now();
    // DEV: auto-complete payment to avoid manual verification
    await Payment.create({ payment_id, user_email:email, payment_method, payment_status:'completed', payment_amount:total_amount, upi_reference_id }, { transaction:t });

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

// POST /api/orders/verify-payment
exports.verifyUpiPayment = async (req,res)=>{
  try{ const { orderNumber, transactionId, status } = req.body; const order = await Order.findOne({ where:{ order_number:orderNumber } }); if(!order) return res.status(404).json({ message:'Order not found' }); const payment = await Payment.findOne({ where:{ payment_id: order.payment_id } }); if(!payment) return res.status(404).json({ message:'Payment not found' }); payment.upi_transaction_id = transactionId; payment.payment_status = status==='SUCCESS'?'completed':'failed'; await payment.save(); order.order_status = status==='SUCCESS'?'confirmed':'pending'; await order.save(); res.json({ success:true, payment_status: payment.payment_status, order_status: order.order_status }); }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};