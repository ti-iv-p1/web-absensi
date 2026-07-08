const router = require('express').Router();

const DashboardController = require('../controllers/DashboardController');

router.get('/', DashboardController.showDashboard);

module.exports = router;
