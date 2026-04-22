const db = require('../database/config');

function ambilSemuaAdmin(){
    return db.prepare(`
        SELECT id, nama, email 
        FROM pengguna 
        WHERE peran = 'admin'
    `).all(); 
}

function ambilAdminById(id){
    return db.prepare(`
        SELECT id, nama, email
        FROM pengguna
        WHERE id = ?
    `).get(id);
}

function buatAdmin(nama, email){
    const stmt = db.prepare(`
        INSERT INTO pengguna (nama, email, password, peran)
        VALUES (?, ?, ?, ?)`);
    stmt.run(nama, email, bcrypt.hashSync(email, 10), 'admin');
}

function updateAdmin(id, nama, email){
    const stmt = db.prepare(`
        UPDATE pengguna
        SET nama = ?, email = ?
        WHERE id = ?`);
    stmt.run(nama, email, id);
}

function hapusAdmin(id){
    const stmt = db.prepare('DELETE FROM pengguna WHERE id = ?');
    stmt.run(id);
}

module.exports = {
    ambilSemuaAdmin,
    ambilAdminById,
    buatAdmin,
    updateAdmin,
    hapusAdmin
}