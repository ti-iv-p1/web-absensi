# Web Absensi IBBI

Sistem manajemen absensi mahasiswa berbasis web untuk Institut Bisnis dan Informatika Indonesia (IBBI). Aplikasi ini dibangun menggunakan Node.js dengan pola arsitektur MVC (Model-View-Controller).

## 📋 Daftar Isi

- [Fitur](#-fitur)
- [Teknologi](#-teknologi)
- [Instalasi](#-instalasi)
- [Struktur Proyek](#-struktur-proyek)
- [Cara Kerja Kode](#-cara-kerja-kode)
- [Database Schema](#-database-schema)
- [Penggunaan](#-penggunaan)
- [Konvensi Kode](#-konvensi-kode)
- [Security](#-security)
- [Email Notifications](#-email-notifications)
- [Pengembangan Selanjutnya](#-pengembangan-selanjutnya)

## ✨ Fitur

### Fitur yang Sudah Diimplementasikan

- ✅ **Sistem Autentikasi** - Login, logout, lupa password, reset password via email
- ✅ **Manajemen Admin** - CRUD untuk pengguna admin
- ✅ **Manajemen Dosen** - CRUD untuk data dosen dengan NIDN
- ✅ **Manajemen Mahasiswa** - CRUD untuk data mahasiswa dengan NIM
- ✅ **Manajemen Mata Kuliah** - CRUD untuk data mata kuliah dan SKS
- ✅ **Manajemen Kelas** - CRUD untuk kelas per mata kuliah dan dosen pengampu
- ✅ **Peserta Kelas** - Pendaftaran mahasiswa ke kelas
- ✅ **Email Notifikasi** - Email kredensial akun baru (dosen & mahasiswa) dan reset password dengan template HTML profesional
- ✅ **Sistem Role-Based** - Tiga role: admin, dosen, mahasiswa
- ✅ **Session Management** - Login session dengan middleware autentikasi
- ✅ **Password Hashing** - Menggunakan bcrypt untuk keamanan password
- ✅ **Validasi Form** - Validasi lengkap untuk setiap input

### Fitur yang Belum Diimplementasikan

- ⏳ **Sesi Absensi** - Pembuatan sesi absensi per pertemuan
- ⏳ **Pencatatan Absensi** - Pencatatan kehadiran mahasiswa (hadir, izin, sakit, alpha)

## 🛠 Teknologi

- **Backend Framework**: Express.js 5.x
- **Template Engine**: Handlebars (express-handlebars)
- **Database**: SQLite 3 (better-sqlite3)
- **CSS Framework**: Bootstrap 5.3
- **Password Hashing**: bcrypt
- **Email Service**: Nodemailer
- **Session Management**: express-session
- **Environment Config**: dotenv
- **Development Tool**: nodemon

## 📦 Instalasi

### Prasyarat

- Node.js (versi 14 atau lebih baru)
- npm (Node Package Manager)

### Langkah Instalasi

1. Clone atau download repository ini

2. Install dependencies:

```bash
npm install
```

3. Inisialisasi database:

```bash
npm run db:init
```

4. Jalankan server development:

```bash
npm run dev
```

5. Buka browser dan akses:

```
http://localhost:3000
```

## 📁 Struktur Proyek

```
web-absensi/
├── config/               # Konfigurasi aplikasi
│   └── mail.js           # Konfigurasi Nodemailer
├── controllers/           # Controller untuk handle request dan response
│   ├── AdminController.js
│   ├── AuthController.js   # Login, logout, forgot/reset password
│   ├── DosenController.js
│   ├── KelasController.js  # CRUD kelas + peserta kelas
│   ├── MahasiswaController.js
│   └── MataKuliahController.js
├── database/             # Konfigurasi dan inisialisasi database
│   ├── config.js         # Koneksi SQLite
│   └── init.js           # Script pembuatan tabel
├── middlewares/          # Middleware Express
│   └── authMiddleware.js  # isAuthenticated, isNotAuthenticated
├── models/               # Model untuk query database
│   ├── Admin.js
│   ├── Dosen.js
│   ├── Kelas.js
│   ├── Mahasiswa.js
│   ├── MataKuliah.js
│   └── PesertaKelas.js
├── routes/               # Definisi routing
│   ├── adminRoutes.js
│   ├── authRoutes.js
│   ├── dosenRoutes.js
│   ├── kelasRoutes.js
│   ├── mahasiswaRoutes.js
│   └── matakuliahRoutes.js
├── views/                # Template Handlebars
│   ├── layouts/
│   │   └── main.hbs      # Layout utama
│   └── pages/
│       ├── index.hbs     # Halaman home
│       ├── admin/        # Halaman admin
│       ├── auth/         # Halaman login, forgot-password, reset-password
│       ├── dosen/        # Halaman dosen
│       ├── kelas/        # Halaman kelas dan peserta kelas
│       ├── mahasiswa/    # Halaman mahasiswa
│       └── mata-kuliah/  # Halaman mata kuliah
├── .env.example          # Contoh konfigurasi environment variables
├── diagram.dbml          # Diagram database
├── index.js              # Entry point aplikasi
└── package.json          # Dependencies dan scripts
```

## ⚙️ Cara Kerja Kode

Aplikasi ini menggunakan pola arsitektur **MVC (Model-View-Controller)** dengan alur kerja sebagai berikut:

### 1. Request Flow

```
Browser → Routes → Controller → Model → Database
                      ↓
                    View (Handlebars) → Browser
```

### 2. Komponen Utama

#### A. **Entry Point (index.js)**

File `index.js` adalah titik masuk aplikasi yang mengatur:

```javascript
require('dotenv').config(); // 1. Load environment variables
const app = express();

// 2. Middleware untuk parsing form data
app.use(express.urlencoded({ extended: true }));

// 3. Konfigurasi session
app.use(session({
  secret: 'aku-cinta-ibbi',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 } // 1 jam
}));

// 4. Konfigurasi Handlebars dengan custom helpers
app.engine('hbs', engine({
  helpers: {
    inc: (value) => parseInt(value) + 1,   // Untuk nomor urut
    eq: (a, b) => a === b,                 // Untuk kondisi
    isSelected: (a, b) => ...,             // Selected dropdown
    inArray: (arr, val) => ...             // Array contains
  }
}));

// 5. Middleware session ke semua view
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// 6. Static files (Bootstrap dari node_modules)
app.use('/bootstrap', express.static(...));

// 7. Registrasi routes (auth tanpa middleware)
app.use("/auth", authRoutes);
app.use("/mahasiswa", isAuthenticated, mahasiswaRoutes);
app.use("/dosen", isAuthenticated, dosenRoutes);
app.use("/kelas", isAuthenticated, kelasRoutes);
// ...

// 8. Start server di port 3000
app.listen(3000);
```
```

#### B. **Database Layer (database/)**

**config.js** - Membuat koneksi SQLite yang shared:

```javascript
const Database = require("better-sqlite3");
const db = new Database("absensi-ibbi.db");
module.exports = db;
```

**init.js** - Script untuk membuat tabel dengan foreign key constraints:

```javascript
db.pragma("foreign_keys = ON"); // Aktifkan FK
db.exec(`CREATE TABLE IF NOT EXISTS pengguna ...`);
db.exec(`CREATE TABLE IF NOT EXISTS mahasiswa ...`);
// ... dst
```

#### C. **Model Layer (models/)**

Model bertanggung jawab untuk **semua operasi database**. Menggunakan prepared statements untuk keamanan.

Contoh: `models/Mahasiswa.js`

```javascript
const db = require("../database/config");

// Query SELECT dengan JOIN
function ambilSemuaMahasiswa() {
  return db
    .prepare(
      `
        SELECT pengguna.id, mahasiswa.nim, mahasiswa.program_studi, 
               mahasiswa.angkatan, pengguna.nama, pengguna.email 
        FROM mahasiswa
        JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
    `,
    )
    .all(); // .all() untuk multiple rows
}

// INSERT dengan foreign key relationship
function buatMahasiswa(nim, nama, email, program_studi, angkatan) {
  // 1. Insert ke tabel pengguna dulu
  const stmt = db.prepare(`
        INSERT INTO pengguna (nama, email, password, peran) 
        VALUES (?, ?, ?, ?)
    `);
  const result = stmt.run(
    nama,
    email,
    bcrypt.hashSync(nim, 10), // Hash NIM sebagai password default
    "mahasiswa",
  );

  // 2. Ambil ID yang baru dibuat
  const penggunaId = result.lastInsertRowid;

  // 3. Insert ke tabel mahasiswa dengan FK ke pengguna
  const mahasiswaStmt = db.prepare(`
        INSERT INTO mahasiswa (pengguna_id, nim, program_studi, angkatan) 
        VALUES (?, ?, ?, ?)
    `);
  mahasiswaStmt.run(penggunaId, nim, program_studi, angkatan);
}
```

**Pola Query**:

- `.all()` → untuk SELECT multiple rows
- `.get()` → untuk SELECT single row
- `.run()` → untuk INSERT/UPDATE/DELETE, return `{ lastInsertRowid, changes }`

#### D. **Controller Layer (controllers/)**

Controller menangani **validasi**, **business logic**, dan **rendering view**.

Contoh: `controllers/MahasiswaController.js`

```javascript
// 1. Fungsi Validasi
function validateMahasiswa(nim, nama, email, program_studi, angkatan) {
  const pesanError = [];

  // Validasi NIM (8-15 digit angka)
  if (!nim || nim.trim() === "") {
    pesanError.push("NIM mahasiswa tidak boleh kosong");
  } else if (!/^\d{8,15}$/.test(nim.trim())) {
    pesanError.push("NIM harus 8-15 digit angka");
  }

  // Validasi nama (min 3 karakter, hanya huruf dan spasi)
  if (!nama || nama.trim() === "") {
    pesanError.push("Nama tidak boleh kosong");
  } else if (nama.trim().length < 3) {
    pesanError.push("Nama minimal 3 karakter");
  } else if (!/^[a-zA-Z\s]+$/.test(nama.trim())) {
    pesanError.push("Nama hanya boleh huruf dan spasi");
  }

  // ... validasi lainnya

  return pesanError; // Array of error messages
}

// 2. Handler untuk CREATE
function createMahasiswa(req, res) {
  const { nim, nama, email, program_studi, angkatan } = req.body;

  // Validasi input
  const pesanError = validateMahasiswa(
    nim,
    nama,
    email,
    program_studi,
    angkatan,
  );

  // Jika ada error, render ulang form dengan error messages
  if (pesanError.length > 0) {
    res.render("pages/mahasiswa/create", {
      pesanError,
      formData: { nim, nama, email, program_studi, angkatan },
    });
    return;
  }

  // Jika valid, simpan ke database via model
  MahasiswaModel.buatMahasiswa(nim, nama, email, program_studi, angkatan);

  // Redirect ke list page
  res.redirect("/mahasiswa/list");
}
```

**Pola Controller**:

- `showCreateForm` → Render form kosong
- `createEntity` → Validasi & insert data
- `listEntity` → Ambil data & render list
- `showEditForm` → Render form dengan data existing
- `editEntity` → Validasi & update data
- `deleteEntity` → Hapus data

#### E. **Route Layer (routes/)**

Routes memetakan URL ke controller functions.

Contoh: `routes/mahasiswaRoutes.js`

```javascript
const router = require("express").Router();
const MahasiswaController = require("../controllers/MahasiswaController");

// GET /mahasiswa/create → Form create
router.get("/create", MahasiswaController.showCreateForm);

// POST /mahasiswa/create → Submit form create
router.post("/create", MahasiswaController.createMahasiswa);

// GET /mahasiswa/list → Daftar mahasiswa
router.get("/list", MahasiswaController.listMahasiswa);

// GET /mahasiswa/edit/:id → Form edit
router.get("/edit/:id", MahasiswaController.showEditForm);

// POST /mahasiswa/edit/:id → Submit form edit
router.post("/edit/:id", MahasiswaController.editMahasiswa);

// POST /mahasiswa/delete/:id → Delete mahasiswa
router.post("/delete/:id", MahasiswaController.deleteMahasiswa);

module.exports = router;
```

#### F. **View Layer (views/)**

Menggunakan **Handlebars** sebagai template engine.

**Layout**: `views/layouts/main.hbs`

```handlebars
<html>
  <head>
    <title>Web Absensi</title>
    <link rel="stylesheet" href="/bootstrap/css/bootstrap.min.css" />
  </head>
  <body>
    <nav class="navbar">
      <!-- Navigation menu -->
    </nav>

    <div class="container">
      {{{body}}}
      <!-- Content dari page akan dimasukkan di sini -->
    </div>

    <script src="/bootstrap/js/bootstrap.bundle.min.js"></script>
  </body>
</html>
```

**Page**: `views/pages/mahasiswa/create.hbs`

```handlebars
<h1>Create Mahasiswa</h1>

<!-- Display validation errors -->
{{#if pesanError}}
  <div class="alert alert-danger">
    <ul>
      {{#each pesanError}}
        <li>{{this}}</li>
      {{/each}}
    </ul>
  </div>
{{/if}}

<!-- Form dengan Bootstrap classes -->
<form action="/mahasiswa/create" method="POST">
  <div class="mb-3">
    <label for="nim">NIM</label>
    <input type="text" name="nim" class="form-control" />
  </div>
  <!-- ... field lainnya -->
  <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

### 3. Alur Lengkap Contoh: Create Mahasiswa

```
1. User mengakses GET /mahasiswa/create
   ↓
2. Route menjalankan MahasiswaController.showCreateForm()
   ↓
3. Controller render view 'pages/mahasiswa/create'
   ↓
4. User mengisi form dan submit (POST /mahasiswa/create)
   ↓
5. Route menjalankan MahasiswaController.createMahasiswa()
   ↓
6. Controller validasi input:
   - Jika ada error → render ulang form dengan pesanError
   - Jika valid → lanjut step 7
   ↓
7. Controller panggil MahasiswaModel.buatMahasiswa()
   ↓
8. Model:
   a. INSERT ke tabel 'pengguna' (dapat penggunaId)
   b. INSERT ke tabel 'mahasiswa' dengan FK penggunaId
   ↓
9. Controller redirect ke /mahasiswa/list
   ↓
10. User melihat daftar mahasiswa (data baru sudah ada)
```

## 🗄️ Database Schema

Database menggunakan **SQLite** dengan struktur sebagai berikut:

### Tabel Utama

**pengguna** - Tabel user dengan role-based system

```sql
- id (PK, AUTO_INCREMENT)
- nama (TEXT)
- email (TEXT, UNIQUE)
- password (TEXT, hashed dengan bcrypt)
- peran (TEXT: 'admin' | 'dosen' | 'mahasiswa')
- reset_token (TEXT, NULLABLE) -- untuk reset password
- dibuat_pada (DATETIME)
- diperbarui_pada (DATETIME)
```

**mahasiswa** - Data mahasiswa

```sql
- id (PK)
- pengguna_id (FK → pengguna.id, ON DELETE CASCADE)
- nim (TEXT, UNIQUE, 8-15 digit)
- program_studi (TEXT: 'ti' | 'si' | 'it')
- angkatan (INTEGER, 2000-2100)
```

**dosen** - Data dosen

```sql
- id (PK)
- pengguna_id (FK → pengguna.id, ON DELETE CASCADE)
- nidn (TEXT, UNIQUE)
- departemen (TEXT: 'fish' | 'fast')
```

**mata_kuliah** - Data mata kuliah

```sql
- id (PK)
- kode (TEXT, UNIQUE)
- nama (TEXT)
- sks (INTEGER)
```

**kelas** - Kelas per mata kuliah dan dosen

```sql
- id (PK)
- mata_kuliah_id (FK → mata_kuliah.id)
- dosen_id (FK → pengguna.id)
- nama_kelas (TEXT)
- semester (INTEGER: 1-8)
- tahun_akademik (TEXT)
- program_studi (TEXT: 'ti' | 'si' | 'it')
```

**peserta_kelas** - Many-to-many mahasiswa dan kelas

```sql
- id (PK)
- kelas_id (FK → kelas.id)
- mahasiswa_id (FK → pengguna.id)
```

### Tabel untuk Fitur yang Belum Diimplementasikan

- **sesi_absensi** - Sesi pertemuan per kelas
- **absensi** - Record kehadiran mahasiswa

Lihat [diagram.dbml](diagram.dbml) untuk schema lengkap dan relasi antar tabel.

## 📖 Penggunaan

### Menjalankan Aplikasi

```bash
# Development mode (auto-reload)
npm run dev

# Inisialisasi ulang database (HATI-HATI: menghapus data!)
npm run db:init
```

### Navigasi Menu

- **Login** (`/auth/login`) - Halaman login
- **Home** (`/`) - Halaman utama (setelah login)
- **Mata Kuliah** (`/mata-kuliah/list`) - Manajemen mata kuliah
- **Dosen** (`/dosen/list`) - Manajemen dosen
- **Mahasiswa** (`/mahasiswa/list`) - Manajemen mahasiswa
- **Kelas** (`/kelas/list`) - Manajemen kelas & peserta kelas
- **Admin** (`/admin/list`) - Manajemen admin

### Default Password

Sistem membuat password default berdasarkan role:

- **Mahasiswa**: Password = NIM mereka
- **Dosen**: Password = NIDN mereka
- **Admin**: Password yang diinput saat pembuatan

Semua password di-hash menggunakan bcrypt sebelum disimpan.

## 📝 Konvensi Kode

### Bahasa: Indonesia

Seluruh kode menggunakan **bahasa Indonesia** untuk penamaan:

**Function naming**:

- `ambil*` - untuk fetch/get data (contoh: `ambilSemuaMahasiswa`)
- `buat*` - untuk create data (contoh: `buatMahasiswa`)
- `update*` - untuk update data
- `hapus*` - untuk delete data
- `kirim*` - untuk mengirim data (contoh: `kirimEmailDataUser`)

**Variable naming**:

- `pesanError` - error messages
- `pesanSukses` - success messages
- `penggunaId` - user ID
- `mataKuliah` - course
- `formData` - form data yang diisi user

**Database columns**:

- `pengguna_id` - user ID
- `dibuat_pada` - created at
- `diperbarui_pada` - updated at
- `nama_kelas` - class name

### Naming Conventions

- **JavaScript**: camelCase (`penggunaId`, `showCreateForm`)
- **Database**: snake_case (`pengguna_id`, `mata_kuliah`)
- **Routes**: kebab-case (`/mata-kuliah/create`)

### Aturan Validasi

**NIM (Nomor Induk Mahasiswa)**:

- Wajib diisi
- 8-15 digit angka
- Regex: `/^\d{8,15}$/`

**NIDN (Nomor Induk Dosen Nasional)**:

- Wajib diisi
- 10 digit angka
- Regex: `/^\d{10}$/`

**Nama**:

- Minimal 3 karakter
- Hanya huruf dan spasi
- Regex: `/^[a-zA-Z\s]+$/`

**Email**:

- Format email valid
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

**Program Studi**:

- Pilihan: 'ti', 'si', atau 'it'

**Angkatan**:

- Antara 2000 - 2100

**Departemen (Dosen)**:

- Pilihan: 'fish' (Fakultas Ilmu Sosial dan Humaniora) atau 'fast' (Fakultas Sains dan Teknologi)

## 🔐 Security

- **Session Authentication**: Login session dengan cookie (1 jam expired)
- **Password Hashing**: Menggunakan bcrypt dengan salt rounds 10
- **Foreign Key Constraints**: ON DELETE CASCADE untuk data integrity
- **Prepared Statements**: Mencegah SQL injection
- **Input Validation**: Validasi di controller sebelum ke database
- **Email Notifications**: Kredensial akun baru dan reset password dikirim via email

## 📧 Email Notifications

Sistem mengirimkan email otomatis dalam dua skenario:

### 1. Akun Baru (Dosen & Mahasiswa)
Saat admin membuat akun dosen atau mahasiswa baru, sistem mengirim email ke alamat email user berisi:
- Nama lengkap dan role
- Email dan password (default: NIDN/NIM)
- Tombol **Login Sekarang**
- Peringatan untuk segera ganti password

### 2. Reset Password
Saat user lupa password dan mengisi form lupa password:
- User memasukkan email
- Sistem verifikasi email terdaftar
- Generate reset token (random 32-byte hex) dan simpan di database
- Kirim email dengan tombol **Reset Password**
- User klik link, masuk ke halaman reset password
- Setelah password direset, redirect ke halaman login dengan pesan sukses

### Konfigurasi Email

Salin `.env.example` ke `.env` dan isi:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=email@example.com
EMAIL_PASSWORD=your-app-password
APP_URL=http://localhost:3000
```

## 🚀 Pengembangan Selanjutnya

Untuk menambah modul baru:

1. Buat `models/[Nama].js` dengan fungsi ambil*, buat*, update*, hapus*
2. Buat `controllers/[Nama]Controller.js` dengan validate\* dan CRUD handlers
3. Buat `routes/[nama]Routes.js` dengan standard CRUD routes
4. Buat views di `views/pages/[nama]/` (create.hbs, list.hbs, edit.hbs)
5. Register route di `index.js` dengan middleware `isAuthenticated`:
   `app.use("/nama", isAuthenticated, namaRoutes)`

## 📄 Lisensi

ISC

## 👥 Kontributor

Institut Bisnis dan Informatika Indonesia (IBBI)

---

Untuk detail teknis lebih lanjut, lihat [AGENTS.md](AGENTS.md).
