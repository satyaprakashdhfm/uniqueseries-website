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

// Format detailed customization info; omit empty values
const formatDateWithInstructions = (product, customization = {}) => {
  if (!customization || Object.keys(customization).length === 0) return null;

  const type = (product?.type || '').toLowerCase();
  const nameLower = (product?.name || '').toLowerCase();
  const parts = [];

  const pushIfExists = (label, value) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      parts.push(`${label}: ${value}`);
    }
  };

  // Resin Frames
  if (type === 'resin_frame') {
    const isSmall = nameLower.includes('small');
    const sizeText = isSmall ? 'Small Resin 8x15 inches' : 'Large Resin 13x19 inches';
    parts.push(sizeText);

    if (isSmall) {
      pushIfExists('Name', customization.resinName1 || customization.names);
      pushIfExists('Event', customization.resinEvent || customization.event);
      pushIfExists('Event Date', customization.resinEventDate || customization.specialData);
    } else {
      const p1Label = [customization.resinName1, customization.resinDate1].filter(Boolean).join(' - ');
      const p2Label = [customization.resinName2, customization.resinDate2].filter(Boolean).join(' - ');
      if (p1Label) pushIfExists('Person 1', p1Label);
      if (p2Label) pushIfExists('Person 2', p2Label);
      pushIfExists('Event', customization.resinEvent || customization.event);
      pushIfExists('Event Date', customization.resinEventDate);
    }
  }
  // Photo Frames
  else if (type === 'photo_frame') {
    pushIfExists('Special Date', customization.specialData);
    pushIfExists('Names', customization.names);

    const p1 = [customization.frameName1, customization.frameDate1].filter(Boolean).join(' - ');
    const p2 = [customization.frameName2, customization.frameDate2].filter(Boolean).join(' - ');
    if (p1) pushIfExists('Person 1', p1);
    if (p2) pushIfExists('Person 2', p2);

    pushIfExists('Event', customization.event || customization.frameEvent || customization.customEvent);
    pushIfExists('Event Date', customization.frameEventDate);

    if (Array.isArray(customization.customNames) && customization.customNames.filter(Boolean).length > 0) {
      pushIfExists('Names', customization.customNames.filter(Boolean).join(', '));
    }
    if (Array.isArray(customization.customNotes) && customization.customNotes.length > 0) {
      const notesList = customization.customNotes
        .map((n) => `${n?.date || '—'}-${n?.currency || n?.denomination || '—'}`)
        .join(', ');
      pushIfExists('Notes', notesList);
    }
    pushIfExists('Set', customization.frameSetType);
    pushIfExists('Description', customization.description);
  }
  // Currency Notes
  else if (type === 'currency_note') {
    pushIfExists('Special Date', customization.specialData);
    pushIfExists('Description', customization.description);
  }
  // Default / Fallback
  else if (customization.description) {
    pushIfExists('Description', customization.description);
  }

  return parts.length > 0 ? parts.join(' | ') : null;
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

    const datewith_instructions = formatDateWithInstructions(product, customization);

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