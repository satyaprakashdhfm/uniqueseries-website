const { Wishlist, Product } = require('../models');

// GET /api/wishlist
exports.getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.findAll({ where: { user_email: req.user.email }, include:[{ model: Product, as:'product', attributes:['name','price','image_url'] }] });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productName } = req.body;
    if (!productName) return res.status(400).json({ message: 'productName is required' });
    const product = await Product.findByPk(productName);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const exists = await Wishlist.findOne({ where: { user_email: req.user.email, product_name: productName } });
    if (exists) return res.json(exists);
    const created = await Wishlist.create({ user_email: req.user.email, product_name: productName });
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/wishlist/:productName
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productName } = req.params;
    const row = await Wishlist.findOne({ where: { user_email: req.user.email, product_name: productName } });
    if (!row) return res.status(404).json({ message: 'Item not found' });
    await row.destroy();
    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
