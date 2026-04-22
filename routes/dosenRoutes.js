const router = require('express').Router();

const DosenModel = require('../models/Dosen');

// ROUTE DOSEN
// ====================

router.get('/create', (req, res) => {
  res.render('pages/dosen/create');
});

router.get('/list', (req, res) => {
  // const dosen = db.prepare(`
  //   SELECT pengguna.id, dosen.nidn, dosen.departemen, pengguna.nama, pengguna.email 
  //   FROM dosen
  //   JOIN pengguna ON dosen.pengguna_id = pengguna.id
  // `).all();
  const dosen = DosenModel.ambilSemuaDosen();

  res.render('pages/dosen/list', { dosen });
});

router.get('/edit/:id', (req, res) => {
  const { id } = req.params;

  // const dosen = db.prepare(`
  //   SELECT pengguna.id, dosen.nidn, dosen.departemen, pengguna.nama, pengguna.email
  //   FROM dosen
  //   JOIN pengguna ON dosen.pengguna_id = pengguna.id
  //   where pengguna.id = ?
  // `).get(id);

  const dosen = DosenModel.ambilDosenById(id);

  res.render('pages/dosen/edit', { dosen });
});

router.post('/create', (req, res) => {
  // Ambil data dari form
  const { nidn, nama, email, departemen } = req.body;

  /* // simpan data dosen ke tabel pengguna dahulu
  const stmt = db.prepare(`
    INSERT INTO pengguna (nama, email, password, peran) 
    VALUES (?, ?, ?, ?)`);
  result = stmt.run(nama, email, bcrypt.hashSync(nidn, 10), 'dosen');

  // ambil id pengguna yang baru saja dibuat
  const penggunaId = result.lastInsertRowid;

  // simpan data dosen ke tabel dosen
  const dosenStmt = db.prepare(`
    INSERT INTO dosen (pengguna_id, nidn, departemen) 
    VALUES (?, ?, ?)`);
  dosenStmt.run(penggunaId, nidn, departemen); */

  DosenModel.buatDosen(nidn, nama, email, departemen);

  res.redirect('/dosen/list');
});

router.post('/edit/:id', (req, res) => {
  const { id } = req.params;
  const { nidn, nama, email, departemen } = req.body;

  /* // update data dosen di tabel pengguna
  const stmt = db.prepare(`
    UPDATE pengguna
    SET nama = ?, email = ?
    WHERE id = ?`);
  stmt.run(nama, email, id);

  // update data dosen di tabel dosen
  const dosenStmt = db.prepare(`
    UPDATE dosen
    SET nidn = ?,
      departemen = ?
    WHERE pengguna_id = ?`);
  dosenStmt.run(nidn, departemen, id); */

  DosenModel.updateDosen(id, nidn, nama, email, departemen);

  res.redirect('/dosen/list');
});

router.post('/delete/:id', (req, res) => {
  const { id } = req.params;

  // hapus data dosen di tabel pengguna
  // const stmt = db.prepare('DELETE FROM pengguna WHERE id = ?');
  // stmt.run(id);

  DosenModel.hapusDosen(id);

  res.redirect('/dosen/list');
});

module.exports = router;