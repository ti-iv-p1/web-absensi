const router = require('express').Router();

// const db = require('../database/config');
const AdminModel = require('../models/Admin');

const bcrypt = require('bcrypt');

// ROUTE MAHASISWA
// ====================

router.get('/create', (req, res) => {
  res.render('pages/mahasiswa/create');
});

router.get('/list', (req, res) => {
  // const mahasiswa = db.prepare(`
  //   SELECT pengguna.id, mahasiswa.nim, mahasiswa.program_studi, 
  //     mahasiswa.angkatan, pengguna.nama, pengguna.email 
  //   FROM mahasiswa
  //   JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
  // `).all();
  const mahasiswa = AdminModel.ambilSemuaMahasiswa();

  res.render('pages/mahasiswa/list', { mahasiswa });
});

router.get('/edit/:id', (req, res) => {
  const { id } = req.params;

  // const mahasiswa = db.prepare(`
  //   SELECT pengguna.id, mahasiswa.nim, mahasiswa.program_studi, 
  //     mahasiswa.angkatan, pengguna.nama, pengguna.email 
  //   FROM mahasiswa
  //   JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
  //   where pengguna.id = ?
  // `).get(id);
  const mahasiswa = AdminModel.ambilMahasiswaById(id);

  res.render('pages/mahasiswa/edit', { mahasiswa });
});

router.post('/create', (req, res) => {
  // Ambil data dari form
  const { nim, nama, email, program_studi, angkatan } = req.body;
  
  /* // simpan data mahasiswa ke tabel pengguna dahulu
  const stmt = db.prepare(`
    INSERT INTO pengguna (nama, email, password, peran) 
    VALUES (?, ?, ?, ?)`);
  result = stmt.run(nama, email, bcrypt.hashSync(nim, 10), 'mahasiswa');

  // ambil id pengguna yang baru saja dibuat
  const penggunaId = result.lastInsertRowid;

  // simpan data mahasiswa ke tabel mahasiswa
  const mahasiswaStmt = db.prepare(`
    INSERT INTO mahasiswa (pengguna_id, nim, program_studi, angkatan) 
    VALUES (?, ?, ?, ?)`);
  mahasiswaStmt.run(penggunaId, nim, program_studi, angkatan); */

  AdminModel.buatMahasiswa(nim, nama, email, program_studi, angkatan);

  res.redirect('/mahasiswa/list');
});

router.post('/edit/:id', (req, res) => {
  const { id } = req.params;
  const { nim, nama, email, program_studi, angkatan } = req.body;

  /* // update data mahasiswa di tabel pengguna
  const stmt = db.prepare(`
    UPDATE pengguna 
    SET nama = ?, email = ? 
    WHERE id = ?`);
  stmt.run(nama, email, id);

  // update data mahasiswa di tabel mahasiswa
  const mahasiswaStmt = db.prepare(`
    UPDATE mahasiswa 
    SET nim = ?, program_studi = ?, angkatan = ? 
    WHERE pengguna_id = ?`);
  mahasiswaStmt.run(nim, program_studi, angkatan, id); */

  AdminModel.updateMahasiswa(id, nim, nama, email, program_studi, angkatan);

  res.redirect('/mahasiswa/list');
});

router.post('/delete/:id', (req, res) => {
  const { id } = req.params;

  // hapus data mahasiswa di tabel pengguna
  // const stmt = db.prepare('DELETE FROM pengguna WHERE id = ?');
  // stmt.run(id);

  AdminModel.hapusMahasiswa(id);

  res.redirect('/mahasiswa/list');
});

module.exports = router;