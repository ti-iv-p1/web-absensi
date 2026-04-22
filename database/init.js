const db = require('./config');

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS pengguna (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    peran TEXT NOT NULL CHECK(peran IN ('admin', 'dosen', 'mahasiswa')),
    dibuat_pada DATETIME DEFAULT CURRENT_TIMESTAMP,
    diperbarui_pada DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS mahasiswa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pengguna_id INTEGER NOT NULL,
    nim TEXT UNIQUE NOT NULL,
    program_studi TEXT,
    angkatan INTEGER,
    FOREIGN KEY (pengguna_id) REFERENCES pengguna(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS dosen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pengguna_id INTEGER NOT NULL,
    nidn TEXT UNIQUE NOT NULL,
    departemen TEXT,
    FOREIGN KEY (pengguna_id) REFERENCES pengguna(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS mata_kuliah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kode TEXT UNIQUE NOT NULL,
    nama TEXT NOT NULL,
    sks INTEGER NOT NULL
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mata_kuliah_id INTEGER NOT NULL,
    dosen_id INTEGER NOT NULL,
    nama_kelas TEXT NOT NULL,
    semester TEXT NOT NULL,
    tahun_akademik TEXT NOT NULL,
    FOREIGN KEY (mata_kuliah_id) REFERENCES mata_kuliah(id) ON DELETE CASCADE,
    FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS peserta_kelas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mahasiswa_id INTEGER NOT NULL,
    kelas_id INTEGER NOT NULL,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sesi_absensi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kelas_id INTEGER NOT NULL,
    pertemuan_ke INTEGER NOT NULL,
    topik TEXT,
    tanggal DATE NOT NULL,
    jam_mulai TIME NOT NULL,
    jam_selesai TIME NOT NULL,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS absensi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sesi_id INTEGER NOT NULL,
    mahasiswa_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('hadir', 'izin', 'sakit', 'alpha')),
    waktu_absen DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sesi_id) REFERENCES sesi_absensi(id) ON DELETE CASCADE,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
  );
`);

// Buat indeks untuk meningkatkan performa query
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_mahasiswa_pengguna ON mahasiswa(pengguna_id);
  CREATE INDEX IF NOT EXISTS idx_dosen_pengguna ON dosen(pengguna_id);
  CREATE INDEX IF NOT EXISTS idx_kelas_mata_kuliah ON kelas(mata_kuliah_id);
  CREATE INDEX IF NOT EXISTS idx_kelas_dosen ON kelas(dosen_id);
  CREATE INDEX IF NOT EXISTS idx_peserta_mahasiswa ON peserta_kelas(mahasiswa_id);
  CREATE INDEX IF NOT EXISTS idx_peserta_kelas ON peserta_kelas(kelas_id);
  CREATE INDEX IF NOT EXISTS idx_sesi_kelas ON sesi_absensi(kelas_id);
  CREATE INDEX IF NOT EXISTS idx_absensi_sesi ON absensi(sesi_id);
  CREATE INDEX IF NOT EXISTS idx_absensi_mahasiswa ON absensi(mahasiswa_id);
`);