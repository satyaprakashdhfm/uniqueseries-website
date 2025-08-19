const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { cloudinary } = require('../config/cloudinary');

// Helper to create safe slugs for folder and public_id
const slugifySafe = (val, fallback = '') => {
  const str = (val == null ? fallback : String(val)).toLowerCase();
  return str
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = file.originalname.split('.').pop();
    cb(null, `${uniqueSuffix}.${extension}`);
  }
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage, 
  fileFilter
});

// Single file upload route
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    // If Cloudinary credentials are configured, upload there
    const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    const localPath = path.join(uploadsDir, req.file.filename);

    if (hasCloudinary) {
      const { userId, userName, orderNumber, namePrefix } = req.body || {};
      const userSlug = slugifySafe(userName || userId || 'guest');
      const productSlug = slugifySafe(namePrefix || 'product');
      const timeSlug = Date.now();
      // Upload to a pending folder first (order id not yet known)
      const baseFolder = `currency-gift/users/${userSlug}/pending/${productSlug}-${timeSlug}`;
      const originalBase = path.parse(req.file.originalname || '').name;
      const baseName = slugifySafe(namePrefix || originalBase || `${userSlug}-image`);
      const publicId = baseName || `image-${Date.now()}`;

      cloudinary.uploader.upload(localPath, {
          folder: baseFolder,
          public_id: publicId,
          use_filename: false,
          unique_filename: false,
          overwrite: true,
          resource_type: 'image',
          tags: [userSlug, 'pending']
        })
        .then((result) => {
          // Clean up local file after successful upload
          try { fs.unlinkSync(localPath); } catch {}
          return res.json({ 
            success: true, 
            imageUrl: result.secure_url, 
            public_id: result.public_id, 
            folder: baseFolder,
            originalName: req.file.originalname 
          });
        })
        .catch((err) => {
          console.error('Cloudinary upload error:', err);
          // Fallback: keep local file URL
          const imageUrl = `/uploads/${req.file.filename}`;
          return res.json({ success: true, imageUrl, originalName: req.file.originalname, note: 'Cloudinary failed; using local file' });
        });
    } else {
      // No Cloudinary config; return local file URL
      const imageUrl = `/uploads/${req.file.filename}`;
      return res.json({ success: true, imageUrl, originalName: req.file.originalname, note: 'Cloudinary not configured; using local storage' });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// Multiple files upload route (max 10 images)
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

    if (hasCloudinary) {
      const { userId, userName, namePrefix } = req.body || {};
      const userSlug = slugifySafe(userName || userId || 'guest');
      const productSlug = slugifySafe(namePrefix || 'product');
      const timeSlug = Date.now();
      const baseFolder = `currency-gift/users/${userSlug}/pending/${productSlug}-${timeSlug}`;

      const results = await Promise.all(
        req.files
          .filter((f) => f.mimetype && f.mimetype.startsWith('image/'))
          .map(async (file, idx) => {
          const localPath = path.join(uploadsDir, file.filename);
          try {
            const originalBase = path.parse(file.originalname || '').name;
            const baseName = slugifySafe(namePrefix || originalBase || `${userSlug}-image`);
            const publicId = `${baseName}-${idx + 1}`;

            const uploaded = await cloudinary.uploader.upload(localPath, {
              folder: baseFolder,
              public_id: publicId,
              use_filename: false,
              unique_filename: false,
              overwrite: true,
              resource_type: 'image',
              tags: [userSlug, 'pending']
            });
            try { fs.unlinkSync(localPath); } catch {}
            return { imageUrl: uploaded.secure_url, public_id: uploaded.public_id, folder: baseFolder, originalName: file.originalname };
          } catch (err) {
            console.error('Cloudinary upload error (multiple):', err);
            // Ensure local temp file is cleaned even on failure
            try { fs.unlinkSync(localPath); } catch {}
            // No local fallback when Cloudinary is configured
            return { error: 'cloudinary_failed' };
          }
        })
      );
      const successes = results.filter((r) => r && !r.error);
      const failed = results.length - successes.length;
      if (successes.length === 0) {
        return res.status(502).json({ success: false, message: 'All uploads to Cloudinary failed' });
      }
      return res.json({ success: true, images: successes, count: successes.length, failed });
    } else {
      const results = req.files
        .filter((f) => f.mimetype && f.mimetype.startsWith('image/'))
        .map((file) => ({ imageUrl: `/uploads/${file.filename}`, originalName: file.originalname }));
      return res.json({ success: true, images: results, count: results.length, note: 'Cloudinary not configured; using local storage' });
    }
  } catch (error) {
    console.error('Upload (multiple) error:', error);
    res.status(500).json({ success: false, message: 'Upload failed' });
  }
});

// List images in a Cloudinary folder
router.get('/list', async (req, res) => {
  try {
    const { folder } = req.query || {};
    if (!folder) {
      return res.status(400).json({ success: false, message: 'folder query param is required' });
    }
    const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    if (!hasCloudinary) {
      return res.json({ success: true, images: [], note: 'Cloudinary not configured' });
    }
    const result = await cloudinary.api.resources({ type: 'upload', prefix: `${folder}/`, max_results: 200 });
    const images = (result.resources || []).map(r => ({ imageUrl: r.secure_url, public_id: r.public_id }));
    return res.json({ success: true, images });
  } catch (error) {
    console.error('List folder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list folder images' });
  }
});

module.exports = router;
