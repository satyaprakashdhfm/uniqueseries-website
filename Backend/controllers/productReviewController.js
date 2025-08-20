const { ProductReview, Product, User } = require('../models');

// POST /api/reviews
exports.createReview = async (req, res) => {
  try {
    const { productName, rating, reviewText } = req.body;
    if (!productName || !rating) return res.status(400).json({ message: 'productName and rating are required' });

    const product = await Product.findByPk(productName);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const review = await ProductReview.create({
      product_name: productName,
      user_email: req.user.email,
      rating: Math.min(5, Math.max(1, parseInt(rating)) ),
      review_text: reviewText || ''
    });
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message:'Server error' });
  }
};

// GET /api/reviews/product/:productName
exports.getProductReviews = async (req,res)=>{
  try{
    const { productName } = req.params;
    const reviews = await ProductReview.findAll({ where:{ product_name: productName, is_approved:true }, order:[['created_at','DESC']] });
    res.json(reviews);
  }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};

// GET /api/reviews/user
exports.getUserReviews = async (req,res)=>{
  try{
    const reviews = await ProductReview.findAll({ where:{ user_email:req.user.email }, order:[['created_at','DESC']] });
    res.json(reviews);
  }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};

// PUT /api/reviews/:id
exports.updateReview = async (req,res)=>{
  try{
    const { id } = req.params;
    const { rating, reviewText } = req.body;
    const review = await ProductReview.findOne({ where:{ id, user_email:req.user.email } });
    if(!review) return res.status(404).json({ message:'Review not found' });
    if(rating) review.rating = Math.min(5, Math.max(1, parseInt(rating)) );
    if(reviewText!=null) review.review_text = reviewText;
    await review.save();
    res.json(review);
  }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};

// DELETE /api/reviews/:id
exports.deleteReview = async (req,res)=>{
  try{ const { id } = req.params; const review = await ProductReview.findOne({ where:{ id, user_email:req.user.email } }); if(!review) return res.status(404).json({ message:'Review not found' }); await review.destroy(); res.json({ message:'Review removed' }); }catch(err){ console.error(err); res.status(500).json({ message:'Server error' }); }
};
