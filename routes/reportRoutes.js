const router = require('express').Router();
const { authorize } = require('../middlewares/authMiddleware');

const ReportController = require('../controllers/ReportController');

// Admin Reports
router.get('/admin', authorize('admin'), ReportController.showLaporanAdmin);
router.get('/admin/global', authorize('admin'), ReportController.showRekapGlobal);

// Dosen Reports
router.get('/dosen', authorize('dosen'), ReportController.showLaporanDosen);

// Mahasiswa Reports
router.get('/mahasiswa', authorize('mahasiswa'), ReportController.showLaporanMahasiswa);

module.exports = router;
