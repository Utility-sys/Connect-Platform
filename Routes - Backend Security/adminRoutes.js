const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// All admin routes are strictly restricted to the 'admin' role
router.use(verifyToken);
router.use(authorizeRoles('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getAllUsers);
router.get('/venues', adminController.getAllVenuesForAdmin);
router.put('/venues/:id/moderate', adminController.moderateVenue);
router.put('/credentials', adminController.updateAdminCredentials);

module.exports = router;
