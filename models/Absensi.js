const db = require('../database/config');

// ==================== SESI ABSENSI ====================

function ambilSemuaSesi() {
    return db.prepare(`
        SELECT 
            sesi_absensi.id,
            sesi_absensi.pertemuan_ke,
            sesi_absensi.topik,
            sesi_absensi.tanggal,
            sesi_absensi.jam_mulai,
            sesi_absensi.jam_selesai,
            sesi_absensi.kelas_id,
            kelas.nama_kelas,
            kelas.semester,
            kelas.tahun_akademik,
            mata_kuliah.nama as nama_mata_kuliah,
            pengguna.nama as nama_dosen
        FROM sesi_absensi
        INNER JOIN kelas ON sesi_absensi.kelas_id = kelas.id
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        INNER JOIN dosen ON kelas.dosen_id = dosen.id
        INNER JOIN pengguna ON dosen.pengguna_id = pengguna.id
        ORDER BY sesi_absensi.tanggal DESC, sesi_absensi.jam_mulai DESC
    `).all();
}

function ambilSesiById(id) {
    return db.prepare(`
        SELECT
            sesi_absensi.id,
            sesi_absensi.pertemuan_ke,
            sesi_absensi.topik,
            sesi_absensi.tanggal,
            sesi_absensi.jam_mulai,
            sesi_absensi.jam_selesai,
            sesi_absensi.kelas_id,
            kelas.nama_kelas,
            kelas.semester,
            kelas.tahun_akademik,
            mata_kuliah.nama as nama_mata_kuliah,
            pengguna.nama as nama_dosen
        FROM sesi_absensi
        INNER JOIN kelas ON sesi_absensi.kelas_id = kelas.id
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        INNER JOIN dosen ON kelas.dosen_id = dosen.id
        INNER JOIN pengguna ON dosen.pengguna_id = pengguna.id
        WHERE sesi_absensi.id = ?
    `).get(id);
}

function buatSesi(kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai) {
    const stmt = db.prepare(`
        INSERT INTO sesi_absensi (kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai);
    return result.lastInsertRowid;
}

function updateSesi(id, kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai) {
    const stmt = db.prepare(`
        UPDATE sesi_absensi
        SET kelas_id = ?, pertemuan_ke = ?, topik = ?, tanggal = ?, jam_mulai = ?, jam_selesai = ?
        WHERE id = ?
    `);
    stmt.run(kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai, id);
}

function hapusSesi(id) {
    const stmt = db.prepare('DELETE FROM sesi_absensi WHERE id = ?');
    stmt.run(id);
}

// ==================== ABSENSI (RECORDING) ====================

function ambilAbsensiBySesiId(sesi_id) {
    return db.prepare(`
        SELECT
            absensi.id,
            absensi.sesi_id,
            absensi.mahasiswa_id,
            absensi.status,
            absensi.waktu_absen,
            mahasiswa.nim,
            pengguna.nama
        FROM absensi
        INNER JOIN mahasiswa ON absensi.mahasiswa_id = mahasiswa.id
        INNER JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
        WHERE absensi.sesi_id = ?
        ORDER BY pengguna.nama ASC
    `).all(sesi_id);
}

function ambilAbsensiBySesiDanMahasiswa(sesi_id, mahasiswa_id) {
    return db.prepare(`
        SELECT * FROM absensi
        WHERE sesi_id = ? AND mahasiswa_id = ?
    `).get(sesi_id, mahasiswa_id);
}

function buatAbsensi(sesi_id, mahasiswa_id, status) {
    const stmt = db.prepare(`
        INSERT INTO absensi (sesi_id, mahasiswa_id, status, waktu_absen)
        VALUES (?, ?, ?, datetime('now'))
    `);
    return stmt.run(sesi_id, mahasiswa_id, status);
}

function updateStatusAbsensi(id, status) {
    const stmt = db.prepare(`
        UPDATE absensi
        SET status = ?, waktu_absen = datetime('now')
        WHERE id = ?
    `);
    return stmt.run(status, id);
}

function simpanAbsensiMassal(sesi_id, absensi_data) {
    // absensi_data: array of { mahasiswa_id, status }
    const insertStmt = db.prepare(`
        INSERT INTO absensi (sesi_id, mahasiswa_id, status, waktu_absen)
        VALUES (?, ?, ?, datetime('now'))
    `);
    const updateStmt = db.prepare(`
        UPDATE absensi
        SET status = ?, waktu_absen = datetime('now')
        WHERE sesi_id = ? AND mahasiswa_id = ?
    `);

    absensi_data.forEach(item => {
        const existing = ambilAbsensiBySesiDanMahasiswa(sesi_id, item.mahasiswa_id);
        if (existing) {
            updateStmt.run(item.status, sesi_id, item.mahasiswa_id);
        } else {
            insertStmt.run(sesi_id, item.mahasiswa_id, item.status);
        }
    });
}

function hapusAbsensi(id) {
    const stmt = db.prepare('DELETE FROM absensi WHERE id = ?');
    return stmt.run(id);
}

function ambilRekapAbsensi(kelas_id) {
    return db.prepare(`
        SELECT
            mahasiswa.id as mahasiswa_id,
            mahasiswa.nim,
            pengguna.nama,
            COUNT(CASE WHEN absensi.status = 'hadir' THEN 1 END) as total_hadir,
            COUNT(CASE WHEN absensi.status = 'izin' THEN 1 END) as total_izin,
            COUNT(CASE WHEN absensi.status = 'sakit' THEN 1 END) as total_sakit,
            COUNT(CASE WHEN absensi.status = 'alpha' THEN 1 END) as total_alpha,
            COUNT(absensi.id) as total_sesi
        FROM peserta_kelas
        INNER JOIN mahasiswa ON peserta_kelas.mahasiswa_id = mahasiswa.id
        INNER JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
        LEFT JOIN absensi ON mahasiswa.id = absensi.mahasiswa_id
        LEFT JOIN sesi_absensi ON absensi.sesi_id = sesi_absensi.id AND sesi_absensi.kelas_id = ?
        WHERE peserta_kelas.kelas_id = ?
        GROUP BY mahasiswa.id
        ORDER BY pengguna.nama ASC
    `).all(kelas_id, kelas_id);
}

module.exports = {
    // Sesi Absensi
    ambilSemuaSesi,
    ambilSesiById,
    buatSesi,
    updateSesi,
    hapusSesi,
    // Absensi Recording
    ambilAbsensiBySesiId,
    ambilAbsensiBySesiDanMahasiswa,
    buatAbsensi,
    updateStatusAbsensi,
    simpanAbsensiMassal,
    hapusAbsensi,
    ambilRekapAbsensi
};