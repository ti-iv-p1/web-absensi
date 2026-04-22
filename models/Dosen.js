const db = require('../database/config');

const bcrypt = require('bcrypt');

function ambilSemuaDosen(){
    return db.prepare(`
        SELECT pengguna.id, dosen.nidn, dosen.departemen, pengguna.nama, pengguna.email 
        FROM dosen
        JOIN pengguna ON dosen.pengguna_id = pengguna.id
      `).all();
}

function ambilDosenById(id){
    return db.prepare(`
        SELECT pengguna.id, dosen.nidn, dosen.departemen, pengguna.nama, pengguna.email
        FROM dosen
        JOIN pengguna ON dosen.pengguna_id = pengguna.id
        where pengguna.id = ?
    `).get(id);
}

function buatDosen(nidn, nama, email, departemen){
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
}

function updateDosen(id, nidn, nama, email, departemen){
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
}

function hapusDosen(id){
    // hapus data dosen di tabel pengguna
    const stmt = db.prepare('DELETE FROM pengguna WHERE id = ?');
    stmt.run(id);
}

module.exports = {
    ambilSemuaDosen,
    ambilDosenById,
    buatDosen,
    updateDosen,
    hapusDosen
}