const { Cart, Product, User } = require('../models');
const { Op } = require('sequelize');

// CART_YYYYMMDD_HHMMSS_xxxx helper
const generateCartNumber = () => {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CART_${dateStr}_${rand}`;
};

const formatDateWithInstructions = (productName, details) => {
  if (!details) return null;
  const safeDetails = Array.isArray(details) ? details.join('|') : String(details);
  return `${productName}|${safeDetails}`;
};

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const rows = await Cart.findAll({
      where: { user_email: req.user.email, is_checked_out: false },
      include: [{ model: Product, as: 'product', attributes: ['name','price','w_days'] }],
      order: [['created_at','ASC']]
    });
    const resp = rows.map((r)=>({
      ...r.toJSON(),
      id: r.id,
      Product: r.product
    }));
    res.json(resp);
  } catch(err){
    console.error(err);
    res.status(500).json({ message:'Server error' });
  }
};

// POST /api/cart
exports.addToCart = async (req, res) => {
  try {
    const { productName, quantity, customization={} } = req.body;
    const userEmail = req.user.email;

    const product = await Product.findByPk(productName);
    if(!product || !product.is_available){
      return res.status(404).json({ message:'Product not available' });
    }

    // Determine cart_number: any open cart rows?
    let cart_number = null;
    const openRow = await Cart.findOne({ where:{ user_email: userEmail, is_checked_out:false } });
    if(openRow) cart_number = openRow.cart_number; else cart_number = generateCartNumber();

    // Save only folder path (if provided) otherwise first image as fallback
    const custom_photo_url = customization.folder || customization.custom_photo_url || (Array.isArray(customization.imageUrls) ? customization.imageUrls[0] : null);

    const datewith_instructions = formatDateWithInstructions(productName, customization?.details || customization?.datewith_instructions);

    // Upsert logic: same product + customization in same cart -> increment
    const existing = await Cart.findOne({
      where:{
        cart_number,
        product_name: productName,
        custom_photo_url,
        datewith_instructions,
        is_checked_out:false
      }
    });

    const qty = parseInt(quantity)||1;

    if(existing){
      existing.quantity += qty;
      await existing.save();
      return res.json(existing);
    }

    const created = await Cart.create({
      cart_number,
      user_email: userEmail,
      product_name: productName,
      quantity: qty,
      unit_price: product.price,
      custom_photo_url,
      datewith_instructions,
      is_checked_out:false
    });
    res.status(201).json(created);
  }catch(err){
    console.error(err);
    res.status(500).json({ message:'Server error' });
  }
};

// PUT /api/cart/:id
exports.updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const row = await Cart.findOne({ where:{ id, user_email: req.user.email, is_checked_out:false } });
    if(!row) return res.status(404).json({ message:'Cart item not found' });
    if(quantity<=0){ await row.destroy(); return res.json({ message:'Cart item removed' }); }
    row.quantity = quantity;
    await row.save();
    res.json(row);
  }catch(err){console.error(err);res.status(500).json({ message:'Server error' });}
};

// DELETE /api/cart/:id
exports.removeFromCart = async (req,res)=>{
  try{ const { id } = req.params; const row = await Cart.findOne({ where:{ id, user_email:req.user.email, is_checked_out:false } }); if(!row) return res.status(404).json({ message:'Cart item not found' }); await row.destroy(); res.json({ message:'Cart item removed' }); }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};

// DELETE /api/cart
exports.clearCart = async (req,res)=>{
  try{ await Cart.destroy({ where:{ user_email:req.user.email, is_checked_out:false } }); res.json({ message:'Cart cleared' }); }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};