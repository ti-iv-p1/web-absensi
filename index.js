const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

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

// Buat route untuk mata kuliah
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

// jalankan server di port 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});