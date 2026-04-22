const db = require('../database/config');

const bcrypt = require('bcrypt');

function ambilSemuaMahasiswa() {
    return db.prepare(`
        SELECT pengguna.id, mahasiswa.nim, mahasiswa.program_studi, 
        mahasiswa.angkatan, pengguna.nama, pengguna.email 
        FROM mahasiswa
        JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
    `).all();
}

function ambilMahasiswaById(id) {
    return db.prepare(`
        SELECT pengguna.id, mahasiswa.nim, mahasiswa.program_studi, 
        mahasiswa.angkatan, pengguna.nama, pengguna.email 
        FROM mahasiswa
        JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
        where pengguna.id = ?
    `).get(id);
}

function buatMahasiswa(nim, nama, email, program_studi, angkatan) {
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
}

function updateMahasiswa(id, nim, nama, email, program_studi, angkatan) {
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
}

function hapusMahasiswa(id) {
    const stmt = db.prepare('DELETE FROM pengguna WHERE id = ?');
    stmt.run(id);
}

module.exports = {
    ambilSemuaMahasiswa,
    ambilMahasiswaById,
    buatMahasiswa,
    updateMahasiswa,
    hapusMahasiswa
}