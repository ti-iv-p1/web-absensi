const router = require('express').Router();
const AbsensiController = require('../controllers/AbsensiController');

// Sesi Absensi CRUD
router.get('/list', AbsensiController.listSesi);
router.get('/create', AbsensiController.showCreateForm);
router.post('/create', AbsensiController.createSesi);
router.get('/edit/:id', AbsensiController.showEditForm);
router.post('/edit/:id', AbsensiController.editSesi);
router.post('/delete/:id', AbsensiController.deleteSesi);

// Absensi Recording (take attendance for a session)
router.get('/absen/:id', AbsensiController.showAbsensiForm);
router.post('/absen/:id', AbsensiController.simpanAbsensi);

// Rekap Absensi
router.get('/rekap', AbsensiController.rekapAbsensi);

module.exports = router;