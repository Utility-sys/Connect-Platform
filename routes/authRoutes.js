const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { verifyToken } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validationMiddleware');
const { registerSchema, loginSchema } = require('../validations/joiSchemas');

// Authentication (Public)
router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);

// Two-Factor Authentication (Protected)
router.post('/2fa/setup', verifyToken, authController.setup2FA);
router.post('/2fa/verify', verifyToken, authController.verify2FA);

router.put('/profile', verifyToken, authController.updateProfile);
router.put('/password', verifyToken, authController.updatePassword);
router.delete('/account', verifyToken, authController.deleteAccount);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);

module.exports = router;
