const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { verifyToken } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/profile', verifyToken, authController.updateProfile);
router.put('/password', verifyToken, authController.updatePassword);
router.delete('/account', verifyToken, authController.deleteAccount);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

module.exports = router;
