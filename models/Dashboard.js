const db = require('../database/config');

// ==================== ADMIN DASHBOARD ====================

function ambilStatistikAdmin() {
    const totalMahasiswa = db.prepare(`SELECT COUNT(*) as total FROM mahasiswa`).get();
    const totalDosen = db.prepare(`SELECT COUNT(*) as total FROM dosen`).get();
    const totalAdmin = db.prepare(`SELECT COUNT(*) as total FROM pengguna WHERE peran = 'admin'`).get();
    const totalMataKuliah = db.prepare(`SELECT COUNT(*) as total FROM mata_kuliah`).get();
    const totalKelas = db.prepare(`SELECT COUNT(*) as total FROM kelas`).get();
    const totalSesi = db.prepare(`SELECT COUNT(*) as total FROM sesi_absensi`).get();
    const totalAbsensi = db.prepare(`SELECT COUNT(*) as total FROM absensi`).get();

    // Mahasiswa per program studi
    const mahasiswaPerProdi = db.prepare(`
        SELECT program_studi, COUNT(*) as jumlah
        FROM mahasiswa
        GROUP BY program_studi
        ORDER BY jumlah DESC
    `).all();

    // Dosen per departemen
    const dosenPerDepartemen = db.prepare(`
        SELECT departemen, COUNT(*) as jumlah
        FROM dosen
        GROUP BY departemen
        ORDER BY jumlah DESC
    `).all();

    // Kelas per tahun akademik
    const kelasPerTahun = db.prepare(`
        SELECT tahun_akademik, semester, COUNT(*) as jumlah
        FROM kelas
        GROUP BY tahun_akademik, semester
        ORDER BY tahun_akademik DESC, semester DESC
    `).all();

    // 5 sesi absensi terbaru
    const sesiTerbaru = db.prepare(`
        SELECT 
            sesi_absensi.id,
            sesi_absensi.pertemuan_ke,
            sesi_absensi.topik,
            sesi_absensi.tanggal,
            sesi_absensi.jam_mulai,
            sesi_absensi.jam_selesai,
            kelas.nama_kelas,
            mata_kuliah.nama as nama_mata_kuliah,
            pengguna.nama as nama_dosen
        FROM sesi_absensi
        INNER JOIN kelas ON sesi_absensi.kelas_id = kelas.id
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        INNER JOIN dosen ON kelas.dosen_id = dosen.id
        INNER JOIN pengguna ON dosen.pengguna_id = pengguna.id
        ORDER BY sesi_absensi.tanggal DESC, sesi_absensi.jam_mulai DESC
        LIMIT 5
    `).all();

    // 5 kelas terbaru
    const kelasTerbaru = db.prepare(`
        SELECT 
            kelas.id,
            kelas.nama_kelas,
            kelas.semester,
            kelas.tahun_akademik,
            mata_kuliah.nama as nama_mata_kuliah,
            pengguna.nama as nama_dosen,
            COUNT(peserta_kelas.id) as jumlah_peserta
        FROM kelas
        JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        JOIN dosen ON kelas.dosen_id = dosen.id
        JOIN pengguna ON dosen.pengguna_id = pengguna.id
        LEFT JOIN peserta_kelas ON kelas.id = peserta_kelas.kelas_id
        GROUP BY kelas.id
        ORDER BY kelas.id DESC
        LIMIT 5
    `).all();

    return {
        totalMahasiswa: totalMahasiswa.total,
        totalDosen: totalDosen.total,
        totalAdmin: totalAdmin.total,
        totalMataKuliah: totalMataKuliah.total,
        totalKelas: totalKelas.total,
        totalSesi: totalSesi.total,
        totalAbsensi: totalAbsensi.total,
        mahasiswaPerProdi,
        dosenPerDepartemen,
        kelasPerTahun,
        sesiTerbaru,
        kelasTerbaru
    };
}

// ==================== DOSEN DASHBOARD ====================

function ambilStatistikDosen(penggunaId) {
    // Ambil dosen_id dari pengguna_id
    const dosen = db.prepare(`SELECT id FROM dosen WHERE pengguna_id = ?`).get(penggunaId);
    if (!dosen) return null;
    const dosenId = dosen.id;

    // Total kelas yang diajar
    const totalKelas = db.prepare(`
        SELECT COUNT(*) as total FROM kelas WHERE dosen_id = ?
    `).get(dosenId).total;

    // Total mahasiswa di semua kelas
    const totalMahasiswa = db.prepare(`
        SELECT COUNT(DISTINCT peserta_kelas.mahasiswa_id) as total
        FROM kelas
        INNER JOIN peserta_kelas ON kelas.id = peserta_kelas.kelas_id
        WHERE kelas.dosen_id = ?
    `).get(dosenId).total;

    // Total sesi absensi yang dibuat
    const totalSesi = db.prepare(`
        SELECT COUNT(*) as total
        FROM sesi_absensi
        INNER JOIN kelas ON sesi_absensi.kelas_id = kelas.id
        WHERE kelas.dosen_id = ?
    `).get(dosenId).total;

    // Total rekap absensi per kelas
    const totalAbsensi = db.prepare(`
        SELECT COUNT(*) as total
        FROM absensi
        INNER JOIN sesi_absensi ON absensi.sesi_id = sesi_absensi.id
        INNER JOIN kelas ON sesi_absensi.kelas_id = kelas.id
        WHERE kelas.dosen_id = ?
    `).get(dosenId).total;

    // Daftar kelas dengan jumlah peserta dan progress absensi
    const kelasList = db.prepare(`
        SELECT 
            kelas.id,
            kelas.nama_kelas,
            kelas.semester,
            kelas.tahun_akademik,
            mata_kuliah.nama as nama_mata_kuliah,
            mata_kuliah.kode as kode_mata_kuliah,
            COUNT(DISTINCT peserta_kelas.mahasiswa_id) as jumlah_peserta,
            COUNT(DISTINCT sesi_absensi.id) as jumlah_sesi
        FROM kelas
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        LEFT JOIN peserta_kelas ON kelas.id = peserta_kelas.kelas_id
        LEFT JOIN sesi_absensi ON kelas.id = sesi_absensi.kelas_id
        WHERE kelas.dosen_id = ?
        GROUP BY kelas.id
        ORDER BY kelas.tahun_akademik DESC, kelas.semester DESC, kelas.nama_kelas ASC
    `).all(dosenId);

    // 5 sesi absensi terbaru
    const sesiTerbaru = db.prepare(`
        SELECT 
            sesi_absensi.id,
            sesi_absensi.pertemuan_ke,
            sesi_absensi.topik,
            sesi_absensi.tanggal,
            sesi_absensi.jam_mulai,
            sesi_absensi.jam_selesai,
            kelas.nama_kelas,
            mata_kuliah.nama as nama_mata_kuliah
        FROM sesi_absensi
        INNER JOIN kelas ON sesi_absensi.kelas_id = kelas.id
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        WHERE kelas.dosen_id = ?
        ORDER BY sesi_absensi.tanggal DESC, sesi_absensi.jam_mulai DESC
        LIMIT 5
    `).all(dosenId);

    return {
        dosenId,
        totalKelas,
        totalMahasiswa,
        totalSesi,
        totalAbsensi,
        kelasList,
        sesiTerbaru
    };
}

// ==================== MAHASISWA DASHBOARD ====================

function ambilStatistikMahasiswa(penggunaId) {
    // Ambil mahasiswa_id dari pengguna_id
    const mahasiswa = db.prepare(`SELECT id, nim, program_studi, angkatan FROM mahasiswa WHERE pengguna_id = ?`).get(penggunaId);
    if (!mahasiswa) return null;
    const mahasiswaId = mahasiswa.id;

    // Total kelas yang diikuti
    const totalKelas = db.prepare(`
        SELECT COUNT(*) as total FROM peserta_kelas WHERE mahasiswa_id = ?
    `).get(mahasiswaId).total;

    // Total sesi absensi
    const totalSesi = db.prepare(`
        SELECT COUNT(*) as total FROM absensi WHERE mahasiswa_id = ?
    `).get(mahasiswaId).total;

    // Kehadiran per status
    const kehadiranPerStatus = db.prepare(`
        SELECT 
            absensi.status,
            COUNT(*) as jumlah
        FROM absensi
        WHERE absensi.mahasiswa_id = ?
        GROUP BY absensi.status
    `).all(mahasiswaId);

    // Inisialisasi default jika belum ada data
    const statusMap = { hadir: 0, izin: 0, sakit: 0, alpha: 0 };
    kehadiranPerStatus.forEach(s => {
        statusMap[s.status] = s.jumlah;
    });

    // Daftar kelas dengan ringkasan kehadiran
    const kelasList = db.prepare(`
        SELECT 
            kelas.id as kelas_id,
            kelas.nama_kelas,
            kelas.semester,
            kelas.tahun_akademik,
            mata_kuliah.nama as nama_mata_kuliah,
            mata_kuliah.kode as kode_mata_kuliah,
            COUNT(DISTINCT sesi_absensi.id) as total_sesi,
            COUNT(CASE WHEN absensi.status = 'hadir' THEN 1 END) as total_hadir,
            COUNT(CASE WHEN absensi.status = 'izin' THEN 1 END) as total_izin,
            COUNT(CASE WHEN absensi.status = 'sakit' THEN 1 END) as total_sakit,
            COUNT(CASE WHEN absensi.status = 'alpha' THEN 1 END) as total_alpha
        FROM peserta_kelas
        INNER JOIN kelas ON peserta_kelas.kelas_id = kelas.id
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        LEFT JOIN sesi_absensi ON kelas.id = sesi_absensi.kelas_id
        LEFT JOIN absensi ON sesi_absensi.id = absensi.sesi_id AND absensi.mahasiswa_id = ?
        WHERE peserta_kelas.mahasiswa_id = ?
        GROUP BY kelas.id
        ORDER BY kelas.tahun_akademik DESC, kelas.semester DESC, kelas.nama_kelas ASC
    `).all(mahasiswaId, mahasiswaId);

    // 5 sesi absensi terbaru untuk mahasiswa ini
    const sesiTerbaru = db.prepare(`
        SELECT 
            sesi_absensi.id,
            sesi_absensi.pertemuan_ke,
            sesi_absensi.topik,
            sesi_absensi.tanggal,
            sesi_absensi.jam_mulai,
            sesi_absensi.jam_selesai,
            kelas.nama_kelas,
            mata_kuliah.nama as nama_mata_kuliah,
            absensi.status as status_absensi
        FROM absensi
        INNER JOIN sesi_absensi ON absensi.sesi_id = sesi_absensi.id
        INNER JOIN kelas ON sesi_absensi.kelas_id = kelas.id
        INNER JOIN mata_kuliah ON kelas.mata_kuliah_id = mata_kuliah.id
        WHERE absensi.mahasiswa_id = ?
        ORDER BY sesi_absensi.tanggal DESC, sesi_absensi.jam_mulai DESC
        LIMIT 5
    `).all(mahasiswaId);

    return {
        mahasiswaId,
        nim: mahasiswa.nim,
        programStudi: mahasiswa.program_studi,
        angkatan: mahasiswa.angkatan,
        totalKelas,
        totalSesi,
        totalHadir: statusMap.hadir,
        totalIzin: statusMap.izin,
        totalSakit: statusMap.sakit,
        totalAlpha: statusMap.alpha,
        kelasList,
        sesiTerbaru
    };
}

module.exports = {
    ambilStatistikAdmin,
    ambilStatistikDosen,
    ambilStatistikMahasiswa
};
