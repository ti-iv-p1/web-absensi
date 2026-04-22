const db = require('../database/config');

function ambilSemuaMataKuliah() {
  const stmt = db.prepare('SELECT * FROM mata_kuliah');
  return stmt.all();
}

function ambilMataKuliahById(id) {
  const stmt = db.prepare('SELECT * FROM mata_kuliah WHERE id = ?');
  return stmt.get(id);
}

function buatMataKuliah(nama, kode, sks) {
  const stmt = db.prepare('INSERT INTO mata_kuliah (nama, kode, sks) VALUES (?, ?, ?)');
  stmt.run(nama, kode, sks);
}

function updateMataKuliah(id, nama, kode, sks) {
  const stmt = db.prepare('UPDATE mata_kuliah SET nama = ?, kode = ?, sks = ? WHERE id = ?');
  stmt.run(nama, kode, sks, id);
}

function hapusMataKuliah(id) {
    const stmt = db.prepare('DELETE FROM mata_kuliah WHERE id = ?');
    stmt.run(id);
}

module.exports = {
    ambilSemuaMataKuliah,
    ambilMataKuliahById,
    buatMataKuliah,
    updateMataKuliah,
    hapusMataKuliah
}