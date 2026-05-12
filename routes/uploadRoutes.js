const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Local Storage for Venues
const venueStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/venues/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `venue-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

// Local Storage for Documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/documents/');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  }
});

const upload = multer({ 
  storage: venueStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jfif'];
    if (allowed.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.jfif')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid venue image format.'));
    }
  }
});

const docUpload = multer({ 
  storage: documentStorage,
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/jfif'];
    if (allowed.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.jfif')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid document format.'));
    }
  }
});

// POST /api/upload  — accepts multiple venue images
router.post('/', (req, res) => {
  upload.array('images', 8)(req, res, (err) => {
    if (err) {
      console.error('❌ Local Images Upload Error:', err.message);
      return res.status(400).json({ message: 'Image upload failed: ' + err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    const urls = req.files.map(f => `/uploads/venues/${f.filename}`);
    res.status(200).json({ urls });
  });
});

// POST /api/upload/document — accepts a single verification document
router.post('/document', (req, res) => {
  docUpload.single('document')(req, res, (err) => {
    if (err) {
      console.error('❌ Local Document Upload Error:', err.message);
      return res.status(400).json({ message: 'Document upload failed: ' + err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No document uploaded' });
    }
    res.status(200).json({ url: `/uploads/documents/${req.file.filename}` });
  });
});

module.exports = router;
