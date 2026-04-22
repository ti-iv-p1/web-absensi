const router = require('express').Router();

const MataKuliahController = require('../controllers/MataKuliahController');

router.get('/list', MataKuliahController.listMataKuliah);

router.get('/create', MataKuliahController.showCreateForm);

router.get('/edit/:id', MataKuliahController.showEditForm);

router.post('/create', MataKuliahController.createMataKuliah);

router.post('/edit/:id', MataKuliahController.editMataKuliah);

router.post('/delete/:id', MataKuliahController.deleteMataKuliah);


module.exports = router;