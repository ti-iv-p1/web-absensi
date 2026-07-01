const router = require('express').Router();
const KelasController = require('../controllers/KelasController');

const { authorize } = require('../middlewares/authMiddleware');

router.get('/list', authorize('admin', 'dosen'), KelasController.listKelas);
router.get('/create', authorize('admin'), KelasController.showCreateForm);
router.post('/create', authorize('admin'), KelasController.createKelas);
router.get('/edit/:id', authorize('admin'), KelasController.showEditForm);
router.post('/edit/:id', authorize('admin'), KelasController.editKelas);
router.post('/delete/:id', authorize('admin'), KelasController.deleteKelas);

module.exports = router;
