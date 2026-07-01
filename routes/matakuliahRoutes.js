const router = require('express').Router();

const MataKuliahController = require('../controllers/MataKuliahController');

const { authorize } = require('../middlewares/authMiddleware');

router.get('/list', authorize('admin','dosen'), MataKuliahController.listMataKuliah);

router.get('/create', authorize('admin'), MataKuliahController.showCreateForm);

router.get('/edit/:id', authorize('admin'), MataKuliahController.showEditForm);

router.post('/create', authorize('admin'), MataKuliahController.createMataKuliah);

router.post('/edit/:id', authorize('admin'), MataKuliahController.editMataKuliah);

router.post('/delete/:id', authorize('admin'), MataKuliahController.deleteMataKuliah);


module.exports = router;