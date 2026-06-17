const DosenModel = require("../models/Dosen");

const { transporter } = require("../config/mail");

const APP_URL = process.env.APP_URL || "http://localhost:3000";

function validateDosen(nidn, nama, email, departemen) {
  const pesanError = [];

  /*
  dosen
    - NIDN
        - wajib diisi
        - harus berisi 10 digit angka (regex)
    - nama
        - wajib diisi
        - minimal 3 karakter
        - hanya boleh huruf dan spasi (regex)
    - email
        - wajib diisi
        - format email valid (regex)
    - departemen
        - wajib di pilih
        - pilihan departemen valid (fish atau fast)
  */

  if (!nidn || nidn.trim() === "") {
    pesanError.push("NIDN dosen tidak boleh kosong");
  } else if (!/^\d{10}$/.test(nidn.trim())) {
    pesanError.push("NIDN dosen harus terdiri dari 10 digit angka");
  }

  if (!nama || nama.trim() === "") {
    pesanError.push("Nama dosen tidak boleh kosong");
  } else if (nama.trim().length < 3) {
    pesanError.push("Nama dosen harus terdiri dari minimal 3 karakter");
  } else if (!/^[a-zA-Z\s]+$/.test(nama.trim())) {
    pesanError.push("Nama dosen hanya boleh mengandung huruf dan spasi");
  }

  if (!email || email.trim() === "") {
    pesanError.push("Email dosen tidak boleh kosong");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    pesanError.push("Format email dosen tidak valid");
  }

  if (!departemen || (departemen !== "fish" && departemen !== "fast")) {
    pesanError.push("Departemen dosen harus dipilih dan valid");
  }

  return pesanError;
}

function showCreateForm(req, res) {
  res.render("pages/dosen/create");
}

function listDosen(req, res) {
  const dosen = DosenModel.ambilSemuaDosen();

  res.render("pages/dosen/list", { dosen });
}

function showEditForm(req, res) {
  const { id } = req.params;

  const dosen = DosenModel.ambilDosenById(id);

  res.render("pages/dosen/edit", { dosen });
}

function createDosen(req, res) {
  const { nidn, nama, email, departemen } = req.body;

  const pesanError = validateDosen(nidn, nama, email, departemen);

  // mengirimkan pesan error ke view jika ada error
  if (pesanError.length > 0) {
    res.render("pages/dosen/create", {
      pesanError,
      formData: { nidn, nama, email, departemen },
    });
    return;
  }

  DosenModel.buatDosen(nidn, nama, email, departemen);

  kirimEmailDataUser(nama, email, nidn, departemen);

  res.redirect("/dosen/list");
}

async function kirimEmailDataUser(nama, email, password, departemen) {
  const labelDept = {
    fish: "Fakultas Ilmu Sosial dan Humaniora (FISH)",
    fast: "Fakultas Sains dan Teknologi (FaST)",
  };

  const html = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: linear-gradient(135deg, #0d6efd, #0a58ca); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 24px;">Web Absensi IBBI</h1>
      </div>
      <div style="padding: 20px; background: #fafafa;">
          <p style="font-size: 16px; color: #333;">Halo <strong>${nama}</strong>,</p>
          <p style="font-size: 14px; color: #555;">Akun <strong>Dosen ${labelDept[departemen] || departemen}</strong> Anda telah berhasil dibuat di sistem Web Absensi IBBI. Berikut adalah kredensial login Anda:</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #fff; border: 1px solid #ddd; border-radius: 4px;">
              <tr>
                  <td style="padding: 10px 15px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px; color: #333;">Email</td>
                  <td style="padding: 10px 15px; border-bottom: 1px solid #eee; color: #0d6efd;">${email}</td>
              </tr>
              <tr>
                  <td style="padding: 10px 15px; font-weight: bold; color: #333;">Password</td>
                  <td style="padding: 10px 15px; color: #dc3545;">${password}</td>
              </tr>
          </table>

          <p style="font-size: 13px; color: #888; font-style: italic;">⚠️  Sebaiknya segera ganti password setelah login pertama.</p>

          <div style="text-align: center; margin: 25px 0;">
              <a href="${APP_URL}/auth/login" style="background: #0d6efd; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: bold; display: inline-block;">Login Sekarang</a>
          </div>
      </div>
      <div style="padding: 15px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee;">
          <p>© 2026 Web Absensi IBBI. Sistem Informasi Akademik.</p>
          <p>Email ini dikirim otomatis, jangan membalas email ini.</p>
      </div>
  </div>
  `;

  // Kirim email data user
  await transporter.sendMail({
    from: {
      name: "Admin Absensi",
      address: "admin@ibbi.ac.id",
    },
    to: email,
    subject: `Akun IBBI - ${nama}`,
    html: html,
  });
}

function editDosen(req, res) {
  const { id } = req.params;
  const { nidn, nama, email, departemen } = req.body;

  const pesanError = validateDosen(nidn, nama, email, departemen);

  if (pesanError.length > 0) {
    res.render("pages/dosen/edit", {
      pesanError,
      formData: { nidn, nama, email, departemen },
      id,
    });
    return;
  }

  DosenModel.updateDosen(id, nidn, nama, email, departemen);

  res.redirect("/dosen/list");
}

function deleteDosen(req, res) {
  const { id } = req.params;

  DosenModel.hapusDosen(id);

  res.redirect("/dosen/list");
}

module.exports = {
  showCreateForm,
  listDosen,
  showEditForm,
  createDosen,
  editDosen,
  deleteDosen,
};
