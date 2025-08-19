const { Product } = require('../models');
const { Op } = require('sequelize');
const { cloudinary } = require('../config/cloudinary');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const { type, search } = req.query;
    
    let whereClause = { is_available: true };
    
    // Filter by product type
    if (type) {
      whereClause.type = type;
    }
    
    // Search by name
    if (search) {
      whereClause.name = { [Op.iLike]: `%${search}%` };
    }
    
    const products = await Product.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product by name (since name is now primary key)
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get products by type
exports.getProductsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    const products = await Product.findAll({
      where: {
        type,
        is_available: true
      }
    });
    
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { name, type, is_available, price, w_days } = req.body;

    // Basic validation
    if (!name || !type || !price) {
      return res.status(400).json({ message: 'Name, type, and price are required' });
    }

    // Get image URL from Cloudinary
    const image_url = req.file ? req.file.path : null;
    const image_public_id = req.file ? req.file.filename : null;

    const product = await Product.create({
      name,
      type,
      is_available: is_available !== undefined ? is_available : true,
      price,
      w_days,
      image_url,
      image_public_id
    });

    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin: Update a product
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { type, is_available, price, w_days } = req.body;

    // Update product fields
    if (type) product.type = type;
    if (is_available !== undefined) product.is_available = is_available;
    if (price) product.price = price;
    if (w_days) product.w_days = w_days;

    // Handle image update
    if (req.file) {
      // If there's an old image, delete it from Cloudinary
      if (product.image_public_id) {
        await cloudinary.uploader.destroy(product.image_public_id);
      }
      product.image_url = req.file.path;
      product.image_public_id = req.file.filename;
    }

    await product.save();

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};