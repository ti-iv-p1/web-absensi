const ReportModel = require('../models/Report');
const KelasModel = require('../models/Kelas');

// ==================== ADMIN REPORTS ====================

function showLaporanAdmin(req, res) {
    const { kelas_id, program_studi, angkatan, tanggal_mulai, tanggal_selesai } = req.query;

    const semuaKelas = KelasModel.ambilSemuaKelas();
    const semuaProdi = ReportModel.ambilSemuaProdi();
    const semuaAngkatan = ReportModel.ambilSemuaAngkatan();

    const rekap = ReportModel.ambilRekapAbsensi(
        kelas_id || null,
        program_studi || null,
        angkatan || null,
        tanggal_mulai || null,
        tanggal_selesai || null
    );

    return res.render('pages/reports/admin', {
        rekap,
        semuaKelas,
        semuaProdi,
        semuaAngkatan,
        filter: {
            kelas_id: kelas_id || '',
            program_studi: program_studi || '',
            angkatan: angkatan || '',
            tanggal_mulai: tanggal_mulai || '',
            tanggal_selesai: tanggal_selesai || ''
        },
        halaman: 'reports'
    });
}

function showRekapGlobal(req, res) {
    const data = ReportModel.ambilRekapGlobal();

    return res.render('pages/reports/admin', {
        rekapGlobal: data,
        mode: 'global',
        halaman: 'reports'
    });
}

// ==================== DOSEN REPORTS ====================

function showLaporanDosen(req, res) {
    const userId = req.session.user_id;
    const { kelas_id } = req.query;

    const daftarKelas = ReportModel.ambilSemuaKelasByDosenId(userId);

    let laporanKelas = null;
    let kelasTerpilih = null;

    if (kelas_id) {
        laporanKelas = ReportModel.ambilLaporanPerKelas(kelas_id, userId);
        if (laporanKelas) {
            kelasTerpilih = laporanKelas.kelas;

            // Precompute sesi statuses per mahasiswa for the matrix table
            laporanKelas.rekapMahasiswa = laporanKelas.rekapMahasiswa.map(m => {
                m.sesiStatuses = laporanKelas.sesiList.map(sesi => {
                    const key = m.mahasiswa_id + '_' + sesi.id;
                    return {
                        sesi_id: sesi.id,
                        pertemuan_ke: sesi.pertemuan_ke,
                        status: laporanKelas.absensiMap[key] || null
                    };
                });
                return m;
            });
        }
    }

    return res.render('pages/reports/dosen', {
        daftarKelas,
        laporanKelas,
        kelasTerpilih,
        filter: {
            kelas_id: kelas_id || ''
        },
        halaman: 'reports'
    });
}

// ==================== MAHASISWA REPORTS ====================

function showLaporanMahasiswa(req, res) {
    const userId = req.session.user_id;

    const data = ReportModel.ambilLaporanIndividu(userId);

    if (!data) {
        return res.status(404).render('pages/error', {
            pesanError: 'Data mahasiswa tidak ditemukan'
        });
    }

    return res.render('pages/reports/mahasiswa', {
        data,
        halaman: 'reports'
    });
}

module.exports = {
    showLaporanAdmin,
    showRekapGlobal,
    showLaporanDosen,
    showLaporanMahasiswa
};
