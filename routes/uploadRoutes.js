const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Disk storage: save to /public/uploads with original name + timestamp
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit per file

// POST /api/upload  — accepts up to 8 images, field name "images"
router.post('/', upload.array('images', 8), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  // Return publicly accessible paths
  const urls = req.files.map(f => `/uploads/${f.filename}`);
  res.status(200).json({ urls });
});

module.exports = router;
