const router = require('express').Router();

const AuthController = require('../controllers/AuthController');

router.get('/login', AuthController.showLoginForm);

router.post('/login', AuthController.handleLogin);

router.get('/logout', AuthController.handleLogout);

module.exports = router;