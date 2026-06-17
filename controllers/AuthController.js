const db = require('../database/config');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const { transporter } = require('../config/mail');

// Menampilkan form login
function showLoginForm(req, res) {
  res.render('pages/auth/login');
}

// Menampilkan form lupa password
function showForgotPasswordForm(req, res) {
  res.render('pages/auth/forgot-password');
}

// Menampilkan form reset password
function showResetPasswordForm(req, res) {
  const { token } = req.query;

  res.render('pages/auth/reset-password', {
    token
  });
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

function handleForgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.render('pages/auth/forgot-password', {
      pesanError: ['Email harus diisi']
    });
  }

  const user = db.prepare(`
          SELECT id, nama, email 
          FROM pengguna 
          WHERE email = ?
      `).get(email);

  if (!user) {
    return res.render('pages/auth/forgot-password', {
      pesanError: ['Email tidak terdaftar']
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Simpan reset token di database
  db.prepare(`
    UPDATE pengguna 
    SET reset_token = ?, diperbarui_pada = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(resetToken, user.id);

  kirimEmailResetPassword(user.email, user.nama, resetToken)
    .then(() => {
      res.render('pages/auth/forgot-password', {
        pesanSukses: ['Link reset password telah dikirim ke email Anda']
      });
    })
    .catch((error) => {
      console.error('Error saat mengirim email reset password:', error);
      res.render('pages/auth/forgot-password', {
        pesanError: ['Terjadi kesalahan saat mengirim email reset password']
      });
    });
}

async function kirimEmailResetPassword(email, nama, resetToken) {
  // Kirim email reset password
  await transporter.sendMail({
    from: {
      name: 'Admin',
      address: 'admin@ibbi.ac.id'
    },
    to: email,
    subject: 'Reset Password',
    html: `<p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Halo ${nama},</p>
            <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Kami menerima permintaan untuk mereset password Anda. Silakan klik tautan di bawah ini untuk mereset password Anda:</p>
            <a href="http://localhost:3000/auth/reset-password?token=${resetToken}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">Jika Anda tidak meminta reset password, abaikan email ini.</p>`  
  })
}

function handleResetPassword(req, res) {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.render('pages/auth/reset-password', {
      token,
      pesanError: ['Token dan password harus diisi']
    });
  }

  // Cari pengguna berdasarkan reset token
  const user = db.prepare(`
          SELECT id 
          FROM pengguna 
          WHERE reset_token = ?
      `).get(token);

  // Jika token tidak valid
  if (!user) {
    return res.render('pages/auth/reset-password', {
      token,
      pesanError: ['Token tidak valid']
    });
  }

  // Hash password baru
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Update password di database dan hapus reset token
  db.prepare(`
    UPDATE pengguna 
    SET password = ?, reset_token = NULL, diperbarui_pada = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(hashedPassword, user.id);

  res.render('pages/auth/reset-password', {
    pesanSukses: ['Password berhasil direset. Anda dapat login dengan password baru Anda.']
  });
}

module.exports = {
    showLoginForm,
    showForgotPasswordForm,
    showResetPasswordForm,
    handleLogin,
    handleLogout,
    handleForgotPassword,
    handleResetPassword
}