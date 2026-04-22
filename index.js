const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');

const matakuliahRoutes = require('./routes/matakuliahRoutes');
const mahasiswaRoutes = require('./routes/mahasiswaRoutes');
const dosenRoutes = require('./routes/dosenRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Inisialisasi express app
const app = express();
app.use(express.urlencoded({ extended: true })); // Middleware untuk parsing form data

// Konfigurasi Handlebars sebagai view engine
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  helpers: {
    inc: (value) => parseInt(value) + 1,
    eq: (a, b) => a === b
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

app.use("/mata-kuliah",matakuliahRoutes);
app.use("/mahasiswa",mahasiswaRoutes);
app.use("/dosen",dosenRoutes);
app.use("/admin",adminRoutes);

// jalankan server di port 3000
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});