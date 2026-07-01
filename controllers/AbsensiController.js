const AbsensiModel = require('../models/Absensi');
const KelasModel = require('../models/Kelas');
const PesertaKelasModel = require('../models/PesertaKelas');

const VALID_STATUS = ['hadir', 'izin', 'sakit', 'alpha'];

// ==================== VALIDATION ====================

function validateSesiAbsensi(kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai, edit_id = null) {
    const pesanError = [];

    // Validate kelas_id
    if (!kelas_id || kelas_id.trim() === '') {
        pesanError.push("Kelas harus dipilih");
    } else if (isNaN(parseInt(kelas_id))) {
        pesanError.push("Kelas tidak valid");
    }

    // Validate pertemuan_ke
    if (!pertemuan_ke || pertemuan_ke.trim() === '') {
        pesanError.push("Pertemuan ke- tidak boleh kosong");
    } else {
        const pertemuan = parseInt(pertemuan_ke);
        if (isNaN(pertemuan) || pertemuan < 1 || pertemuan > 16) {
            pesanError.push("Pertemuan ke- harus antara 1 dan 16");
        }
    }

    // Validate topik
    if (!topik || topik.trim() === '') {
        pesanError.push("Topik tidak boleh kosong");
    } else if (topik.trim().length < 3) {
        pesanError.push("Topik harus terdiri dari minimal 3 karakter");
    } else if (topik.trim().length > 200) {
        pesanError.push("Topik tidak boleh lebih dari 200 karakter");
    }

    // Validate tanggal
    if (!tanggal || tanggal.trim() === '') {
        pesanError.push("Tanggal tidak boleh kosong");
    } else {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;
        if (!datePattern.test(tanggal.trim())) {
            pesanError.push("Format tanggal tidak valid (YYYY-MM-DD)");
        }
    }

    // Validate jam_mulai
    if (!jam_mulai || jam_mulai.trim() === '') {
        pesanError.push("Jam mulai tidak boleh kosong");
    }

    // Validate jam_selesai
    if (!jam_selesai || jam_selesai.trim() === '') {
        pesanError.push("Jam selesai tidak boleh kosong");
    }

    // Validate jam_selesai > jam_mulai
    if (jam_mulai && jam_selesai && jam_mulai.trim() !== '' && jam_selesai.trim() !== '') {
        if (jam_selesai <= jam_mulai) {
            pesanError.push("Jam selesai harus lebih besar dari jam mulai");
        }
    }

    // Check duplicate pertemuan_ke for same kelas
    if (!pesanError.length && kelas_id && pertemuan_ke) {
        const existingSesi = AbsensiModel.ambilSemuaSesi().find(s =>
            s.kelas_id === parseInt(kelas_id) &&
            s.pertemuan_ke === parseInt(pertemuan_ke) &&
            (!edit_id || s.id !== parseInt(edit_id))
        );
        if (existingSesi) {
            pesanError.push(`Pertemuan ke-${pertemuan_ke} untuk kelas ini sudah ada`);
        }
    }

    return pesanError;
}

// ==================== SESI ABSENSI CRUD ====================

function listSesi(req, res) {
    if (req.session.peran === 'dosen') {
        const dosenId = req.session.user_id;
        const sesiByDosen = AbsensiModel.ambilSemuaSesiByDosenId(dosenId);
        return res.render('pages/absensi/list', {
            sesiAbsensi: sesiByDosen
        });
    }else {
        const sesiAbsensi = AbsensiModel.ambilSemuaSesi();

        return res.render('pages/absensi/list', {
            sesiAbsensi: sesiAbsensi
        });
    }
}

function showCreateForm(req, res) {
    const kelas = KelasModel.ambilSemuaKelas();
    return res.render('pages/absensi/create', {
        kelas: kelas,
        formData: {},
        pesanError: []
    });
}

function createSesi(req, res) {
    const { kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai } = req.body;

    const pesanError = validateSesiAbsensi(kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai);

    if (pesanError.length > 0) {
        const kelas = KelasModel.ambilSemuaKelas();
        return res.render('pages/absensi/create', {
            pesanError,
            formData: { kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai },
            kelas
        });
    }

    AbsensiModel.buatSesi(kelas_id, pertemuan_ke, topik.trim(), tanggal, jam_mulai, jam_selesai);
    return res.redirect('/absensi/list');
}

function showEditForm(req, res) {
    const { id } = req.params;
    const sesi = AbsensiModel.ambilSesiById(id);

    if (!sesi) {
        return res.status(404).send('Sesi absensi tidak ditemukan');
    }

    const kelas = KelasModel.ambilSemuaKelas();
    return res.render('pages/absensi/edit', {
        kelas: kelas,
        absensi: sesi,
        formData: {},
        pesanError: []
    });
}

function editSesi(req, res) {
    const { id } = req.params;
    const { kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai } = req.body;

    const sesi = AbsensiModel.ambilSesiById(id);
    if (!sesi) {
        return res.status(404).send('Sesi absensi tidak ditemukan');
    }

    const pesanError = validateSesiAbsensi(kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai, id);

    if (pesanError.length > 0) {
        const kelas = KelasModel.ambilSemuaKelas();
        return res.render('pages/absensi/edit', {
            pesanError,
            formData: { kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai },
            absensi: { id, kelas_id, pertemuan_ke, topik, tanggal, jam_mulai, jam_selesai },
            kelas
        });
    }

    AbsensiModel.updateSesi(id, kelas_id, pertemuan_ke, topik.trim(), tanggal, jam_mulai, jam_selesai);
    return res.redirect('/absensi/list');
}

function deleteSesi(req, res) {
    const { id } = req.params;

    const sesi = AbsensiModel.ambilSesiById(id);
    if (!sesi) {
        return res.status(404).send('Sesi absensi tidak ditemukan');
    }

    AbsensiModel.hapusSesi(id);
    return res.redirect('/absensi/list');
}

// ==================== ABSENSI RECORDING ====================

function showAbsensiForm(req, res) {
    const { id } = req.params; // sesi_id
    const sesi = AbsensiModel.ambilSesiById(id);

    if (!sesi) {
        return res.status(404).send('Sesi absensi tidak ditemukan');
    }

    // Get peserta kelas for this session's class
    const peserta = PesertaKelasModel.ambilMahasiswaByKelasId(sesi.kelas_id);

    // Get existing absensi records for this session
    const absensiExisting = AbsensiModel.ambilAbsensiBySesiId(id);
    const absensiMap = {};
    absensiExisting.forEach(a => {
        absensiMap[a.mahasiswa_id] = a.status;
    });

    // Pre-compute status on each peserta object for easy template access
    const pesertaDenganStatus = peserta.map(p => ({
        ...p,
        status_hadir: absensiMap[p.mahasiswa_id] === 'hadir',
        status_izin: absensiMap[p.mahasiswa_id] === 'izin',
        status_sakit: absensiMap[p.mahasiswa_id] === 'sakit',
        status_alpha: absensiMap[p.mahasiswa_id] === 'alpha' || !absensiMap[p.mahasiswa_id]
    }));

    return res.render('pages/absensi/absen', {
        sesi: sesi,
        peserta: pesertaDenganStatus,
        pesanError: []
    });
}

function simpanAbsensi(req, res) {
    const { id } = req.params; // sesi_id

    const sesi = AbsensiModel.ambilSesiById(id);
    if (!sesi) {
        return res.status(404).send('Sesi absensi tidak ditemukan');
    }

    // Parse form data: status_{{mahasiswa_id}} = status
    const absensiData = [];
    const peserta = PesertaKelasModel.ambilMahasiswaByKelasId(sesi.kelas_id);

    peserta.forEach(p => {
        const statusKey = `status_${p.mahasiswa_id}`;
        const status = req.body[statusKey] || 'alpha';
        absensiData.push({
            mahasiswa_id: parseInt(p.mahasiswa_id),
            status: status
        });
    });

    AbsensiModel.simpanAbsensiMassal(id, absensiData);
    return res.redirect('/absensi/list');
}

// ==================== REKAP ABSENSI ====================

function rekapAbsensi(req, res) {
    const { kelas_id } = req.query;

    const kelas = KelasModel.ambilSemuaKelas();
    let rekap = [];
    let kelasTerpilih = null;

    if (kelas_id) {
        kelasTerpilih = KelasModel.ambilKelasById(kelas_id);
        rekap = AbsensiModel.ambilRekapAbsensi(kelas_id);
    }

    return res.render('pages/absensi/rekap', {
        kelas,
        rekap,
        kelasTerpilih
    });
}

module.exports = {
    // Sesi CRUD
    listSesi,
    showCreateForm,
    createSesi,
    showEditForm,
    editSesi,
    deleteSesi,
    // Absensi Recording
    showAbsensiForm,
    simpanAbsensi,
    // Rekap
    rekapAbsensi
};