const db = require("../database/config");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const { transporter } = require("../config/mail");

const APP_URL = process.env.APP_URL || "http://localhost:3000";

// Menampilkan form login
function showLoginForm(req, res) {
  res.render("pages/auth/login");
}

// Menampilkan form lupa password
function showForgotPasswordForm(req, res) {
  res.render("pages/auth/forgot-password");
}

// Menampilkan form reset password
function showResetPasswordForm(req, res) {
  const { token } = req.query;

  res.render("pages/auth/reset-password", {
    token,
  });
}

// Proses login
function handleLogin(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render("pages/auth/login", {
      pesanError: ["Email dan password harus diisi"],
    });
  }

  const user = db
    .prepare(
      `
            SELECT id, nama, email, password, peran
            FROM pengguna
            WHERE email = ?
        `,
    )
    .get(email);

  if (!user) {
    return res.render("pages/auth/login", {
      pesanError: ["Email tidak terdaftar"],
    });
  }
  if (!bcrypt.compareSync(password, user.password)) {
    return res.render("pages/auth/login", {
      pesanError: ["Password salah"],
    });
  }

  // Simpan informasi pengguna di session
  /*  req.session.user = {
      id: user.id,
      nama: user.nama,
      email: user.email,
    }; */

  req.session.user_id = user.id;
  req.session.nama = user.nama;
  req.session.email = user.email;
  req.session.peran = user.peran;

  res.redirect("/");
}

function handleLogout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error saat logout:", err);
    }
    res.redirect("/auth/login");
  });
}

function handleForgotPassword(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.render("pages/auth/forgot-password", {
      pesanError: ["Email harus diisi"],
    });
  }

  const user = db
    .prepare(
      `
          SELECT id, nama, email
          FROM pengguna
          WHERE email = ?
      `,
    )
    .get(email);

  if (!user) {
    return res.render("pages/auth/forgot-password", {
      pesanError: ["Email tidak terdaftar"],
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Simpan reset token di database
  db.prepare(
    `
    UPDATE pengguna
    SET reset_token = ?, diperbarui_pada = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
  ).run(resetToken, user.id);

  kirimEmailResetPassword(user.email, user.nama, resetToken)
    .then(() => {
      res.render("pages/auth/forgot-password", {
        pesanSukses: ["Link reset password telah dikirim ke email Anda"],
      });
    })
    .catch((error) => {
      console.error("Error saat mengirim email reset password:", error);
      res.render("pages/auth/forgot-password", {
        pesanError: ["Terjadi kesalahan saat mengirim email reset password"],
      });
    });
}

async function kirimEmailResetPassword(email, nama, resetToken) {
  const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #6f42c1, #5a32a3); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 22px;">Reset Password</h1>
        </div>
        <div style="padding: 20px; background: #fafafa;">
            <p style="font-size: 16px; color: #333;">Halo <strong>${nama}</strong>,</p>
            <p style="font-size: 14px; color: #555;">Kami menerima permintaan reset password untuk akun Anda di Web Absensi IBBI. Klik tombol di bawah untuk mereset password Anda:</p>

            <div style="text-align: center; margin: 25px 0;">
                <a href="${resetUrl}" style="background: #6f42c1; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">Reset Password</a>
            </div>

            <p style="font-size: 13px; color: #888; background: #f8f9fa; padding: 10px 15px; border-radius: 4px; border-left: 4px solid #6f42c1;">
                🔗 Atau salin link berikut: <br>
                <a href="${resetUrl}" style="color: #6f42c1; word-break: break-all;">${resetUrl}</a>
            </p>
        </div>
        <div style="padding: 15px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;">
            <p>© 2026 Web Absensi IBBI. Sistem Informasi Akademik.</p>
            <p>Email ini dikirim otomatis, jangan membalas email ini.</p>
        </div>
    </div>
  `;

  // Kirim email reset password
  await transporter.sendMail({
    from: {
      name: "Admin",
      address: "admin@ibbi.ac.id",
    },
    to: email,
    subject: `Reset Password Akun IBBI - ${nama}`,
    html: html,
  });
}

function handleResetPassword(req, res) {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.render("pages/auth/reset-password", {
      token,
      pesanError: ["Token dan password harus diisi"],
    });
  }

  // Cari pengguna berdasarkan reset token
  const user = db
    .prepare(
      `
          SELECT id
          FROM pengguna
          WHERE reset_token = ?
      `,
    )
    .get(token);

  // Jika token tidak valid
  if (!user) {
    return res.render("pages/auth/reset-password", {
      token,
      pesanError: ["Token tidak valid"],
    });
  }

  // Hash password baru
  const hashedPassword = bcrypt.hashSync(password, 10);

  // Update password di database dan hapus reset token
  db.prepare(
    `
    UPDATE pengguna
    SET password = ?, reset_token = NULL, diperbarui_pada = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
  ).run(hashedPassword, user.id);

  res.render("pages/auth/login", {
    pesanSukses: [
      "Password berhasil direset. Anda dapat login dengan password baru Anda.",
    ],
  });
}

module.exports = {
  showLoginForm,
  showForgotPasswordForm,
  showResetPasswordForm,
  handleLogin,
  handleLogout,
  handleForgotPassword,
  handleResetPassword,
};
