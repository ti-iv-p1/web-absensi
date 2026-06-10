const router = require('express').Router();

const AuthController = require('../controllers/AuthController');
const { isNotAuthenticated } = require('../middlewares/authMiddleware');

router.get('/login',isNotAuthenticated, AuthController.showLoginForm);

router.post('/login', isNotAuthenticated, AuthController.handleLogin);

router.get('/logout', AuthController.handleLogout);

module.exports = router;