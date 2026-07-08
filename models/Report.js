const db = require('../database/config');

// ==================== ADMIN REPORTS ====================

/**
 * Rekap Absensi dengan filter opsional
 * Filter: kelas_id, program_studi, angkatan, tanggal_mulai, tanggal_selesai
 */
function ambilRekapAbsensi(kelas_id, program_studi, angkatan, tanggal_mulai, tanggal_selesai) {
    let query = `
        SELECT 
            mahasiswa.id as mahasiswa_id,
            mahasiswa.nim,
            pengguna.nama as nama_mahasiswa,
            mahasiswa.program_studi,
            mahasiswa.angkatan,
            kelas.id as kelas_id,
            kelas.nama_kelas,
            mata_kuliah.nama as nama_mata_kuliah,
            mata_kuliah.kode as kode_mata_kuliah,
            COUNT(CASE WHEN absensi.status = 'hadir' THEN 1 END) as total_hadir,
            COUNT(CASE WHEN absensi.status = 'izin' THEN 1 END) as total_izin,
            COUNT(CASE WHEN absensi.status = 'sakit' THEN 1 END) as total_sakit,
            COUNT(CASE WHEN absensi.status = 'alpha' THEN 1 END) as total_alpha,
            COUNT(absensi.id) as total_sesi
        FROM peserta_kelas
        INNER JOIN mahasiswa ON peserta_kelas.mahasiswa_id = mahasiswa.id
        INNER JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
        INNER JOIN kelas ON peserta_kelas.kelas_id = kelas.id
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        LEFT JOIN sesi_absensi ON kelas.id = sesi_absensi.kelas_id
        LEFT JOIN absensi ON sesi_absensi.id = absensi.sesi_id AND absensi.mahasiswa_id = mahasiswa.id
        WHERE 1=1
    `;
    const params = [];

    if (kelas_id) {
        query += ` AND kelas.id = ?`;
        params.push(kelas_id);
    }
    if (program_studi) {
        query += ` AND mahasiswa.program_studi = ?`;
        params.push(program_studi);
    }
    if (angkatan) {
        query += ` AND mahasiswa.angkatan = ?`;
        params.push(angkatan);
    }
    if (tanggal_mulai) {
        query += ` AND (sesi_absensi.tanggal >= ? OR sesi_absensi.tanggal IS NULL)`;
        params.push(tanggal_mulai);
    }
    if (tanggal_selesai) {
        query += ` AND (sesi_absensi.tanggal <= ? OR sesi_absensi.tanggal IS NULL)`;
        params.push(tanggal_selesai);
    }

    query += `
        GROUP BY mahasiswa.id, kelas.id
        ORDER BY mata_kuliah.nama ASC, kelas.nama_kelas ASC, pengguna.nama ASC
    `;

    return db.prepare(query).all(...params);
}

/**
 * Rekap Global - ringkasan seluruh sistem
 */
function ambilRekapGlobal() {
    // Total data keseluruhan
    const totalMahasiswa = db.prepare(`SELECT COUNT(*) as total FROM mahasiswa`).get().total;
    const totalDosen = db.prepare(`SELECT COUNT(*) as total FROM dosen`).get().total;
    const totalKelas = db.prepare(`SELECT COUNT(*) as total FROM kelas`).get().total;
    const totalSesi = db.prepare(`SELECT COUNT(*) as total FROM sesi_absensi`).get().total;
    const totalAbsensi = db.prepare(`SELECT COUNT(*) as total FROM absensi`).get().total;

    // Distribusi status absensi global
    const distribusiStatus = db.prepare(`
        SELECT status, COUNT(*) as jumlah
        FROM absensi
        GROUP BY status
        ORDER BY jumlah DESC
    `).all();

    // Rata-rata kehadiran per kelas
    const rataKelas = db.prepare(`
        SELECT 
            kelas.id,
            kelas.nama_kelas,
            mata_kuliah.nama as nama_mata_kuliah,
            COUNT(DISTINCT peserta_kelas.mahasiswa_id) as jumlah_mahasiswa,
            COUNT(DISTINCT sesi_absensi.id) as jumlah_sesi,
            COUNT(CASE WHEN absensi.status = 'hadir' THEN 1 END) as total_hadir,
            ROUND(CAST(COUNT(CASE WHEN absensi.status = 'hadir' THEN 1 END) AS REAL) / 
                CASE WHEN COUNT(absensi.id) > 0 THEN COUNT(absensi.id) ELSE 1 END * 100, 2) as persen_hadir
        FROM kelas
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        LEFT JOIN peserta_kelas ON kelas.id = peserta_kelas.kelas_id
        LEFT JOIN sesi_absensi ON kelas.id = sesi_absensi.kelas_id
        LEFT JOIN absensi ON sesi_absensi.id = absensi.sesi_id
        GROUP BY kelas.id
        ORDER BY persen_hadir ASC
    `).all();

    // Mahasiswa dengan alpha terbanyak
    const alphaTertinggi = db.prepare(`
        SELECT 
            mahasiswa.id,
            mahasiswa.nim,
            pengguna.nama,
            mahasiswa.program_studi,
            COUNT(CASE WHEN absensi.status = 'alpha' THEN 1 END) as total_alpha,
            COUNT(absensi.id) as total_sesi,
            ROUND(CAST(COUNT(CASE WHEN absensi.status = 'alpha' THEN 1 END) AS REAL) / 
                CASE WHEN COUNT(absensi.id) > 0 THEN COUNT(absensi.id) ELSE 1 END * 100, 2) as persen_alpha
        FROM mahasiswa
        INNER JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
        INNER JOIN absensi ON mahasiswa.id = absensi.mahasiswa_id
        GROUP BY mahasiswa.id
        HAVING total_alpha > 0
        ORDER BY total_alpha DESC
        LIMIT 10
    `).all();

    return {
        totalMahasiswa,
        totalDosen,
        totalKelas,
        totalSesi,
        totalAbsensi,
        distribusiStatus,
        rataKelas,
        alphaTertinggi
    };
}

// ==================== DOSEN REPORTS ====================

/**
 * Laporan per Kelas untuk Dosen - detail per sesi pertemuan
 */
function ambilLaporanPerKelas(kelas_id, dosen_pengguna_id) {
    // Verifikasi bahwa kelas dimiliki oleh dosen ini
    const dosen = db.prepare(`SELECT id FROM dosen WHERE pengguna_id = ?`).get(dosen_pengguna_id);
    if (!dosen) return null;

    const kelas = db.prepare(`
        SELECT 
            kelas.*,
            mata_kuliah.nama as nama_mata_kuliah,
            mata_kuliah.kode as kode_mata_kuliah,
            pengguna.nama as nama_dosen,
            COUNT(DISTINCT peserta_kelas.mahasiswa_id) as jumlah_peserta
        FROM kelas
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        INNER JOIN dosen ON kelas.dosen_id = dosen.id
        INNER JOIN pengguna ON dosen.pengguna_id = pengguna.id
        LEFT JOIN peserta_kelas ON kelas.id = peserta_kelas.kelas_id
        WHERE kelas.id = ? AND dosen.pengguna_id = ?
        GROUP BY kelas.id
    `).get(kelas_id, dosen_pengguna_id);

    if (!kelas) return null;

    // Daftar mahasiswa di kelas ini
    const mahasiswaList = db.prepare(`
        SELECT 
            mahasiswa.id as mahasiswa_id,
            mahasiswa.nim,
            pengguna.nama as nama_mahasiswa
        FROM peserta_kelas
        INNER JOIN mahasiswa ON peserta_kelas.mahasiswa_id = mahasiswa.id
        INNER JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
        WHERE peserta_kelas.kelas_id = ?
        ORDER BY pengguna.nama ASC
    `).all(kelas_id);

    // Semua sesi untuk kelas ini
    const sesiList = db.prepare(`
        SELECT id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai
        FROM sesi_absensi
        WHERE kelas_id = ?
        ORDER BY pertemuan_ke ASC
    `).all(kelas_id);

    // Rekap per mahasiswa
    const rekapMahasiswa = db.prepare(`
        SELECT 
            mahasiswa.id as mahasiswa_id,
            mahasiswa.nim,
            pengguna.nama as nama_mahasiswa,
            COUNT(CASE WHEN absensi.status = 'hadir' THEN 1 END) as total_hadir,
            COUNT(CASE WHEN absensi.status = 'izin' THEN 1 END) as total_izin,
            COUNT(CASE WHEN absensi.status = 'sakit' THEN 1 END) as total_sakit,
            COUNT(CASE WHEN absensi.status = 'alpha' THEN 1 END) as total_alpha,
            COUNT(absensi.id) as total_sesi
        FROM peserta_kelas
        INNER JOIN mahasiswa ON peserta_kelas.mahasiswa_id = mahasiswa.id
        INNER JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
        LEFT JOIN sesi_absensi ON peserta_kelas.kelas_id = sesi_absensi.kelas_id
        LEFT JOIN absensi ON sesi_absensi.id = absensi.sesi_id AND absensi.mahasiswa_id = mahasiswa.id
        WHERE peserta_kelas.kelas_id = ?
        GROUP BY mahasiswa.id
        ORDER BY pengguna.nama ASC
    `).all(kelas_id);

    // Detail absensi per sesi per mahasiswa (matrix)
    const detailAbsensi = db.prepare(`
        SELECT 
            absensi.sesi_id,
            absensi.mahasiswa_id,
            absensi.status
        FROM absensi
        INNER JOIN sesi_absensi ON absensi.sesi_id = sesi_absensi.id
        WHERE sesi_absensi.kelas_id = ?
    `).all(kelas_id);

    // Bangun matrix: baris=mahasiswa, kolom=sesi
    const absensiMap = {};
    detailAbsensi.forEach(a => {
        const key = `${a.mahasiswa_id}_${a.sesi_id}`;
        absensiMap[key] = a.status;
    });

    return {
        kelas,
        mahasiswaList,
        sesiList,
        rekapMahasiswa,
        absensiMap,
        jumlahSesi: sesiList.length,
        jumlahMahasiswa: mahasiswaList.length
    };
}

function ambilSemuaKelasByDosenId(penggunaId) {
    return db.prepare(`
        SELECT 
            kelas.id,
            kelas.nama_kelas,
            kelas.semester,
            kelas.tahun_akademik,
            mata_kuliah.nama as nama_mata_kuliah,
            mata_kuliah.kode as kode_mata_kuliah,
            COUNT(DISTINCT peserta_kelas.mahasiswa_id) as jumlah_peserta
        FROM kelas
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        INNER JOIN dosen ON kelas.dosen_id = dosen.id
        LEFT JOIN peserta_kelas ON kelas.id = peserta_kelas.kelas_id
        WHERE dosen.pengguna_id = ?
        GROUP BY kelas.id
        ORDER BY kelas.tahun_akademik DESC, kelas.semester DESC, kelas.nama_kelas ASC
    `).all(penggunaId);
}

// ==================== MAHASISWA REPORTS ====================

/**
 * Laporan Individu Mahasiswa - per mata kuliah
 */
function ambilLaporanIndividu(penggunaId) {
    const mahasiswa = db.prepare(`SELECT id, nim, program_studi, angkatan FROM mahasiswa WHERE pengguna_id = ?`).get(penggunaId);
    if (!mahasiswa) return null;
    const mhsId = mahasiswa.id;

    const dataMahasiswa = db.prepare(`
        SELECT mahasiswa.nim, mahasiswa.program_studi, mahasiswa.angkatan, pengguna.nama, pengguna.email
        FROM mahasiswa
        INNER JOIN pengguna ON mahasiswa.pengguna_id = pengguna.id
        WHERE mahasiswa.id = ?
    `).get(mhsId);

    // Per mata kuliah
    const perMataKuliah = db.prepare(`
        SELECT 
            kelas.id as kelas_id,
            kelas.nama_kelas,
            kelas.semester,
            kelas.tahun_akademik,
            mata_kuliah.id as mata_kuliah_id,
            mata_kuliah.nama as nama_mata_kuliah,
            mata_kuliah.kode as kode_mata_kuliah,
            mata_kuliah.sks,
            pengguna.nama as nama_dosen,
            COUNT(DISTINCT sesi_absensi.id) as total_sesi,
            COUNT(CASE WHEN absensi.status = 'hadir' THEN 1 END) as total_hadir,
            COUNT(CASE WHEN absensi.status = 'izin' THEN 1 END) as total_izin,
            COUNT(CASE WHEN absensi.status = 'sakit' THEN 1 END) as total_sakit,
            COUNT(CASE WHEN absensi.status = 'alpha' THEN 1 END) as total_alpha
        FROM peserta_kelas
        INNER JOIN kelas ON peserta_kelas.kelas_id = kelas.id
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        INNER JOIN dosen ON kelas.dosen_id = dosen.id
        INNER JOIN pengguna ON dosen.pengguna_id = pengguna.id
        LEFT JOIN sesi_absensi ON kelas.id = sesi_absensi.kelas_id
        LEFT JOIN absensi ON sesi_absensi.id = absensi.sesi_id AND absensi.mahasiswa_id = ?
        WHERE peserta_kelas.mahasiswa_id = ?
        GROUP BY kelas.id
        ORDER BY kelas.tahun_akademik DESC, kelas.semester DESC, mata_kuliah.nama ASC
    `).all(mhsId, mhsId);

    // Riwayat absensi lengkap
    const riwayatLengkap = db.prepare(`
        SELECT 
            sesi_absensi.tanggal,
            sesi_absensi.pertemuan_ke,
            sesi_absensi.topik,
            sesi_absensi.jam_mulai,
            sesi_absensi.jam_selesai,
            mata_kuliah.nama as nama_mata_kuliah,
            kelas.nama_kelas,
            absensi.status
        FROM absensi
        INNER JOIN sesi_absensi ON absensi.sesi_id = sesi_absensi.id
        INNER JOIN kelas ON sesi_absensi.kelas_id = kelas.id
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        WHERE absensi.mahasiswa_id = ?
        ORDER BY sesi_absensi.tanggal DESC, sesi_absensi.jam_mulai DESC
    `).all(mhsId);

    // Ringkasan global
    const ringkasanGlobal = db.prepare(`
        SELECT 
            COUNT(absensi.id) as total_sesi,
            COUNT(CASE WHEN absensi.status = 'hadir' THEN 1 END) as total_hadir,
            COUNT(CASE WHEN absensi.status = 'izin' THEN 1 END) as total_izin,
            COUNT(CASE WHEN absensi.status = 'sakit' THEN 1 END) as total_sakit,
            COUNT(CASE WHEN absensi.status = 'alpha' THEN 1 END) as total_alpha
        FROM absensi
        WHERE absensi.mahasiswa_id = ?
    `).get(mhsId);

    return {
        mahasiswa: dataMahasiswa,
        perMataKuliah,
        riwayatLengkap,
        ringkasanGlobal
    };
}

// List untuk filter
function ambilSemuaProdi() {
    return db.prepare(`SELECT DISTINCT program_studi FROM mahasiswa ORDER BY program_studi`).all();
}

function ambilSemuaAngkatan() {
    return db.prepare(`SELECT DISTINCT angkatan FROM mahasiswa ORDER BY angkatan DESC`).all();
}

module.exports = {
    ambilRekapAbsensi,
    ambilRekapGlobal,
    ambilLaporanPerKelas,
    ambilSemuaKelasByDosenId,
    ambilLaporanIndividu,
    ambilSemuaProdi,
    ambilSemuaAngkatan
};
