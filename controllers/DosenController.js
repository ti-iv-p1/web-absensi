const DosenModel = require('../models/Dosen');

const { transporter } = require('../config/mail');

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

  if(!nidn || nidn.trim() === '') {
      pesanError.push("NIDN dosen tidak boleh kosong");
  }else if(!/^\d{10}$/.test(nidn.trim())) {
      pesanError.push("NIDN dosen harus terdiri dari 10 digit angka");
  }

  if(!nama || nama.trim() === '') {
      pesanError.push("Nama dosen tidak boleh kosong");
  }else if(nama.trim().length < 3) {
      pesanError.push("Nama dosen harus terdiri dari minimal 3 karakter");
  }else if(!/^[a-zA-Z\s]+$/.test(nama.trim())) {
      pesanError.push("Nama dosen hanya boleh mengandung huruf dan spasi");
  }

  if(!email || email.trim() === '') {
      pesanError.push("Email dosen tidak boleh kosong");
  }else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      pesanError.push("Format email dosen tidak valid");
  }

  if(!departemen || (departemen !== 'fish' && departemen !== 'fast')) {
      pesanError.push("Departemen dosen harus dipilih dan valid");
  }

  return pesanError;  
}

function showCreateForm(req, res) {
  res.render('pages/dosen/create');
}

function listDosen(req, res) {
  const dosen = DosenModel.ambilSemuaDosen();

  res.render('pages/dosen/list', { dosen });
}

function showEditForm(req, res) {
  const { id } = req.params;

  const dosen = DosenModel.ambilDosenById(id);

  res.render('pages/dosen/edit', { dosen });
}

function createDosen(req, res) {
  const { nidn, nama, email, departemen } = req.body;

  const pesanError = validateDosen(nidn, nama, email, departemen);

  // mengirimkan pesan error ke view jika ada error
  if(pesanError.length > 0) {
      res.render('pages/dosen/create', { 
          pesanError, 
          formData : { nidn, nama, email, departemen }
      });
      return;
  }

  DosenModel.buatDosen(nidn, nama, email, departemen);

  kirimEmailDataUser(nama, email, nidn);

  res.redirect('/dosen/list');
}

async function kirimEmailDataUser(nama, email, password) {
  // Kirim email data user
  await transporter.sendMail({
    from: {
      name: 'Admin Absensi',
      address: 'admin@ibbi.ac.id'
    },
    to: email,
    subject: 'Data User Baru',
    html: `
      <p>Halo ${nama},</p>
      <p>Berikut adalah data user Anda:</p>
      <ul>
        <li><strong>Nama:</strong> ${nama}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Silakan login menggunakan email dan password di atas.</p>
      <a href="http://localhost:3000/auth/login" 
      style="background-color: #007bff; color: white; padding: 10px 20px; 
        text-decoration: none; border-radius: 5px;">Login</a>
    `
  });
}

function editDosen(req, res) {
  const { id } = req.params;
  const { nidn, nama, email, departemen } = req.body;

  const pesanError = validateDosen(nidn, nama, email, departemen);

  if(pesanError.length > 0) {
      res.render('pages/dosen/edit', { 
          pesanError, 
          formData : { nidn, nama, email, departemen },
          id
      });
      return;
  }

  DosenModel.updateDosen(id, nidn, nama, email, departemen);

  res.redirect('/dosen/list');
}

function deleteDosen(req, res) {
  const { id } = req.params;

  DosenModel.hapusDosen(id);

  res.redirect('/dosen/list');
}

module.exports = {
  showCreateForm,
  listDosen,
  showEditForm,
  createDosen,
  editDosen,
  deleteDosen
}
