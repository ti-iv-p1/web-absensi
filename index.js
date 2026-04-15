const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

const bcrypt = require('bcrypt');

const Database = require('better-sqlite3');
const db = new Database('absensi.db');

// Inisialisasi express app
const app = express();
app.use(express.urlencoded({ extended: true })); // Middleware untuk parsing form data

// Konfigurasi Handlebars sebagai view engine
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  helpers: {
    inc: (value) => parseInt(value) + 1
  }
}))

// Set view engine ke Handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// load bootstrap dari node_modules
app.use('/bootstrap', 
  express.static(path.join(__dirname, 'node_modules/bootstrap/dist'))
);


// Buat route ke root /
app.get('/', (req, res) => {
  res.render('pages/index');
});

// ROUTE MATA KULIAH
// ====================

app.get('/mata-kuliah/list', (req, res) => {
  const mataKuliah = db.prepare('SELECT * FROM mata_kuliah').all();

  res.render('pages/mata-kuliah/list', { mataKuliah });
});

app.get('/mata-kuliah/create', (req, res) => {
  res.render('pages/mata-kuliah/create');
});

app.get('/mata-kuliah/edit/:id', (req, res) => {
  const { id } = req.params;
  const mataKuliah = db.prepare('SELECT * FROM mata_kuliah WHERE id = ?').get(id);

  res.render('pages/mata-kuliah/edit', { mataKuliah });
});

app.post('/mata-kuliah/create', (req, res) => {
  const { nama, kode, sks } = req.body;
  const stmt = db.prepare('INSERT INTO mata_kuliah (nama, kode, sks) VALUES (?, ?, ?)');
  stmt.run(nama, kode, sks);

  res.redirect('/mata-kuliah/list');
});

app.post('/mata-kuliah/edit/:id', (req, res) => {
  const { nama, kode, sks } = req.body;
  const { id } = req.params;
  const stmt = db.prepare('UPDATE mata_kuliah SET nama = ?, kode = ?, sks = ? WHERE id = ?');
  stmt.run(nama, kode, sks, id);

  res.redirect('/mata-kuliah/list');
});

app.post('/mata-kuliah/delete/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM mata_kuliah WHERE id = ?');
  stmt.run(id);

  res.redirect('/mata-kuliah/list');
});


// ROUTE MAHASISWA
// ====================

app.get('/mahasiswa/create', (req, res) => {
  res.render('pages/mahasiswa/create');
});

app.get('/mahasiswa/list', (req, res) => {
  const mahasiswa = db.prepare(`
    SELECT pengguna.id, mahasiswa.nim, mahasiswa.program_studi, 
      mahasiswa.angkatan, pengguna.nama, pengguna.email 
    FROM mahasiswa
    JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
  `).all();

  res.render('pages/mahasiswa/list', { mahasiswa });
});

app.get('/mahasiswa/edit/:id', (req, res) => {
  const { id } = req.params;

  const mahasiswa = db.prepare(`
    SELECT pengguna.id, mahasiswa.nim, mahasiswa.program_studi, 
      mahasiswa.angkatan, pengguna.nama, pengguna.email 
    FROM mahasiswa
    JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
    where pengguna.id = ?
  `).get(id);

  res.render('pages/mahasiswa/edit', { mahasiswa });
});

app.post('/mahasiswa/create', (req, res) => {
  // Ambil data dari form
  const { nim, nama, email, program_studi, angkatan } = req.body;
  
  // simpan data mahasiswa ke tabel pengguna dahulu
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
  mahasiswaStmt.run(penggunaId, nim, program_studi, angkatan);

  res.redirect('/mahasiswa/list');
});

app.post('/mahasiswa/edit/:id', (req, res) => {
  const { id } = req.params;
  const { nim, nama, email, program_studi, angkatan } = req.body;

  // update data mahasiswa di tabel pengguna
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
  mahasiswaStmt.run(nim, program_studi, angkatan, id);

  res.redirect('/mahasiswa/list');
});

app.post('/mahasiswa/delete/:id', (req, res) => {
  const { id } = req.params;

  // hapus data mahasiswa di tabel pengguna
  const stmt = db.prepare('DELETE FROM pengguna WHERE id = ?');
  stmt.run(id);

  res.redirect('/mahasiswa/list');
});


// ROUTE DOSEN
// ====================

app.get('/dosen/create', (req, res) => {
  res.render('pages/dosen/create');
});

app.get('/dosen/list', (req, res) => {
  const dosen = db.prepare(`
    SELECT pengguna.id, dosen.nidn, dosen.departemen, pengguna.nama, pengguna.email 
    FROM dosen
    JOIN pengguna ON dosen.pengguna_id = pengguna.id
  `).all();

  res.render('pages/dosen/list', { dosen });
});

app.get('/dosen/edit/:id', (req, res) => {
  const { id } = req.params;

  const dosen = db.prepare(`
    SELECT pengguna.id, dosen.nidn, dosen.departemen, pengguna.nama, pengguna.email
    FROM dosen
    JOIN pengguna ON dosen.pengguna_id = pengguna.id
    where pengguna.id = ?
  `).get(id);

  res.render('pages/dosen/edit', { dosen });
});

app.post('/dosen/create', (req, res) => {
  // Ambil data dari form
  const { nidn, nama, email, departemen } = req.body;

  // simpan data dosen ke tabel pengguna dahulu
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
  dosenStmt.run(penggunaId, nidn, departemen);

  res.redirect('/dosen/list');
});

app.post('/dosen/edit/:id', (req, res) => {
  const { id } = req.params;
  const { nidn, nama, email, departemen } = req.body;

  // update data dosen di tabel pengguna
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
  dosenStmt.run(nidn, departemen, id);

  res.redirect('/dosen/list');
});

app.post('/dosen/delete/:id', (req, res) => {
  const { id } = req.params;

  // hapus data dosen di tabel pengguna
  const stmt = db.prepare('DELETE FROM pengguna WHERE id = ?');
  stmt.run(id);

  res.redirect('/dosen/list');
});


// ROUTE ADMIN
// ====================
app.get('/admin/create', (req, res) => {
  res.render('pages/admin/create');
});

app.get('/admin/list', (req, res) => {
  const admin = db.prepare(`
    SELECT id, nama, email 
    FROM pengguna 
    WHERE peran = 'admin'
  `).all(); 

  res.render('pages/admin/list', { admin });
});

app.get('/admin/edit/:id', (req, res) => {
  const { id } = req.params;
  const admin = db.prepare(`
    SELECT id, nama, email
    FROM pengguna
    WHERE id = ?
  `).get(id);


  res.render('pages/admin/edit', { admin });
});

app.post('/admin/create', (req, res) => {
  const { nama, email } = req.body;

  const stmt = db.prepare(`
    INSERT INTO pengguna (nama, email, password, peran)
    VALUES (?, ?, ?, ?)`);
  stmt.run(nama, email, bcrypt.hashSync(email, 10), 'admin');

  res.redirect('/admin/list');
});

app.post('/admin/edit/:id', (req, res) => {
  const { id } = req.params;
  const { nama, email } = req.body;

  const stmt = db.prepare(`
    UPDATE pengguna
    SET nama = ?, email = ?
    WHERE id = ?`);
  stmt.run(nama, email, id);
  
  res.redirect('/admin/list');
});

app.post('/admin/delete/:id', (req, res) => {
  const { id } = req.params;

  const stmt = db.prepare('DELETE FROM pengguna WHERE id = ?');
  stmt.run(id);


  res.redirect('/admin/list');
});

// jalankan server di port 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});