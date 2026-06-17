const router = require('express').Router();

const AuthController = require('../controllers/AuthController');
const { isNotAuthenticated } = require('../middlewares/authMiddleware');

router.get('/login',isNotAuthenticated, AuthController.showLoginForm);

router.post('/login', isNotAuthenticated, AuthController.handleLogin);

router.get('/logout', AuthController.handleLogout);

router.get('/forgot-password', isNotAuthenticated, AuthController.showForgotPasswordForm);

router.post('/forgot-password', isNotAuthenticated, AuthController.handleForgotPassword);

router.get('/reset-password', isNotAuthenticated, AuthController.showResetPasswordForm);

router.post('/reset-password', isNotAuthenticated, AuthController.handleResetPassword);

module.exports = router;