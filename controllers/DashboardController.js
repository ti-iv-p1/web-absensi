const DashboardModel = require('../models/Dashboard');

function showDashboard(req, res) {
    const peran = req.session.peran;
    const userId = req.session.user_id;

    if (peran === 'admin') {
        const statistik = DashboardModel.ambilStatistikAdmin();

        return res.render('pages/dashboard/admin', {
            stats: statistik,
            halaman: 'dashboard'
        });
    }

    if (peran === 'dosen') {
        const statistik = DashboardModel.ambilStatistikDosen(userId);

        if (!statistik) {
            return res.status(404).render('pages/error', {
                pesanError: 'Data dosen tidak ditemukan'
            });
        }

        return res.render('pages/dashboard/dosen', {
            stats: statistik,
            halaman: 'dashboard'
        });
    }

    if (peran === 'mahasiswa') {
        const statistik = DashboardModel.ambilStatistikMahasiswa(userId);

        if (!statistik) {
            return res.status(404).render('pages/error', {
                pesanError: 'Data mahasiswa tidak ditemukan'
            });
        }

        return res.render('pages/dashboard/mahasiswa', {
            stats: statistik,
            halaman: 'dashboard'
        });
    }

    return res.redirect('/auth/login');
}

module.exports = {
    showDashboard
};
