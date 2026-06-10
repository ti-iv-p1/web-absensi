const db = require('../database/config');
const bcrypt = require('bcrypt');

// Menampilkan form login
function showLoginForm(req, res) {
  res.render('pages/auth/login');
}

// Proses login
function handleLogin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('pages/auth/login', {
          pesanError: ['Email dan password harus diisi']
        });
    }

    const user = db.prepare(`
            SELECT id, nama, email, password, peran 
            FROM pengguna 
            WHERE email = ?
        `).get(email);

    if (!user) {
      return res.render('pages/auth/login', {
        pesanError: ['Email tidak terdaftar']
      });
    }
    if (!bcrypt.compareSync(password, user.password)) {
      return res.render('pages/auth/login', {
        pesanError: ['Password salah']
      });
    }

    // Simpan informasi pengguna di session 
   /*  req.session.user = {
      id: user.id,
      nama: user.nama,
      email: user.email,
    }; */
    req.session.id = user.id;
    req.session.nama = user.nama;
    req.session.email = user.email;

    res.redirect('/');
}

function handleLogout(req, res) {
    req.session.destroy((err) => {
      if (err) {
        console.error('Error saat logout:', err);
      }
      res.redirect('/auth/login');
    });
} 

module.exports = {
    showLoginForm,
    handleLogin,
    handleLogout
}