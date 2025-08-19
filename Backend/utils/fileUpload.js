const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const path = require('path');

// Configure multer storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder;
    if (file.fieldname === 'product_image') {
      folder = 'products';
    } else if (file.fieldname === 'custom_photo') {
      folder = 'custom_photos';
    } else {
      folder = 'uploads';
    }
    return {
      folder: folder,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      public_id: `${file.fieldname}-${Date.now()}`
    };
  }
});

// File filter to validate file types
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedFileTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer upload
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter
});

module.exports = { upload };