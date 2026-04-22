const MataKuliahModel = require('../models/MataKuliah');

function listMataKuliah(req, res) {
    const mataKuliah = MataKuliahModel.ambilSemuaMataKuliah();

    res.render('pages/mata-kuliah/list', { mataKuliah });
}

function showCreateForm(req, res) {
    res.render('pages/mata-kuliah/create');
}

function showEditForm(req, res) {
    const { id } = req.params;
    const mataKuliah = MataKuliahModel.ambilMataKuliahById(id);

    res.render('pages/mata-kuliah/edit', { mataKuliah });
}

function createMataKuliah(req, res) {
    const { nama, kode, sks } = req.body;
    MataKuliahModel.buatMataKuliah(nama, kode, sks);

    res.redirect('/mata-kuliah/list');
}

function editMataKuliah(req, res) {
    const { nama, kode, sks } = req.body;
    const { id } = req.params;
    MataKuliahModel.updateMataKuliah(id, nama, kode, sks);

    res.redirect('/mata-kuliah/list');
}

function deleteMataKuliah(req, res) {
    const { id } = req.params;
    MataKuliahModel.hapusMataKuliah(id);

    res.redirect('/mata-kuliah/list');
}

module.exports = {
    listMataKuliah,
    showCreateForm,
    showEditForm,
    createMataKuliah,
    editMataKuliah,
    deleteMataKuliah
}