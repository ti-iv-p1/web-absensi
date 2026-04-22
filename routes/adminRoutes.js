const router = require('express').Router();

// const db = require('../database/config');

const AdminModel = require('../models/Admin');

const bcrypt = require('bcrypt');

// ROUTE ADMIN
// ====================
router.get('/create', (req, res) => {
  res.render('pages/admin/create');
});

router.get('/list', (req, res) => {
  // const admin = db.prepare(`
  //   SELECT id, nama, email 
  //   FROM pengguna 
  //   WHERE peran = 'admin'
  // `).all(); 

  const admin = AdminModel.ambilSemuaAdmin();

  res.render('pages/admin/list', { admin });
});

router.get('/edit/:id', (req, res) => {
  const { id } = req.params;

  // const admin = db.prepare(`
  //   SELECT id, nama, email
  //   FROM pengguna
  //   WHERE id = ?
  // `).get(id);
  const admin = AdminModel.ambilAdminById(id);


  res.render('pages/admin/edit', { admin });
});

router.post('/create', (req, res) => {
  const { nama, email } = req.body;

  // const stmt = db.prepare(`
  //   INSERT INTO pengguna (nama, email, password, peran)
  //   VALUES (?, ?, ?, ?)`);
  // stmt.run(nama, email, bcrypt.hashSync(email, 10), 'admin');

  AdminModel.buatAdmin(nama, email);

  res.redirect('/admin/list');
});

router.post('/edit/:id', (req, res) => {
  const { id } = req.params;
  const { nama, email } = req.body;

  // const stmt = db.prepare(`
  //   UPDATE pengguna
  //   SET nama = ?, email = ?
  //   WHERE id = ?`);
  // stmt.run(nama, email, id);

  AdminModel.updateAdmin(id, nama, email);
  
  res.redirect('/admin/list');
});

router.post('/delete/:id', (req, res) => {
  const { id } = req.params;

  // const stmt = db.prepare('DELETE FROM pengguna WHERE id = ?');
  // stmt.run(id);

  AdminModel.hapusAdmin(id);

  res.redirect('/admin/list');
});

module.exports = router;