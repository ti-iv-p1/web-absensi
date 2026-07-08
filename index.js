require('dotenv').config();

const express = require('express');
const { engine } = require('express-handlebars');
const path = require('path');
const session = require('express-session');

const { transporter } = require('./config/mail');


const matakuliahRoutes = require('./routes/matakuliahRoutes');
const mahasiswaRoutes = require('./routes/mahasiswaRoutes');
const dosenRoutes = require('./routes/dosenRoutes');
const adminRoutes = require('./routes/adminRoutes');
const kelasRoutes = require('./routes/kelasRoutes');
const authRoutes = require('./routes/authRoutes');
const absensiRoutes = require('./routes/absensiRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const { isAuthenticated, authorize } = require('./middlewares/authMiddleware');

// Inisialisasi express app
const app = express();
app.use(express.urlencoded({ extended: true })); // Middleware untuk parsing form data

// Konfigurasi session
app.use(session({
  secret: process.env.SESSION_SECRET || 'default-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 60 * 60 * 1000 * 1
  }
}));

// Konfigurasi Handlebars sebagai view engine
app.engine('hbs', engine({
  extname: 'hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/layouts'),
  helpers: {
    inc: (value) => parseInt(value) + 1,
    isSelected: (a, b) => {
      // Inline helper to return "selected" attribute if values match
      return String(a) === String(b) ? 'selected' : '';
    },
    isChecked: (arr, val) => {
      // Inline helper to return "checked" attribute if value is in array
      if (!arr) return '';
      const arrValues = arr.map(v => String(v));
      return arrValues.includes(String(val)) ? 'checked' : '';
    },
    eq: function(a, b, options) {
      // Works as both block helper and inline helper
      const isEqual = String(a) === String(b);
      if (options && typeof options.fn === 'function') {
        // Block helper context: {{#eq a b}}...{{/eq}}
        return isEqual ? options.fn(this) : options.inverse(this);
      } else {
        // Inline helper context: {{#if (eq a b)}}...{{/if}}
        return isEqual;
      }
    },
    inArray: function(arr, val, options) {
      // Works as both block helper and inline helper
      if (!arr) {
        if (options && typeof options.fn === 'function') {
          return options.inverse(this);
        }
        return false;
      }
      const arrValues = arr.map(v => String(v));
      const isIncluded = arrValues.includes(String(val));
      if (options && typeof options.fn === 'function') {
        // Block helper context: {{#inArray arr val}}...{{/inArray}}
        return isIncluded ? options.fn(this) : options.inverse(this);
      } else {
        // Inline helper context: {{#if (inArray arr val)}}...{{/if}}
        return isIncluded;
      }
    },
    // Math helper: {{math a "op" b}}
    math: (a, op, b) => {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      switch (op) {
        case '+': return numA + numB;
        case '-': return numA - numB;
        case '*': return numA * numB;
        case '/': return numB !== 0 ? numA / numB : 0;
        case '%': return numA % numB;
        default: return 0;
      }
    },
    // Greater than: {{#gt a b}}...{{/gt}}
    gt: (a, b) => parseFloat(a) > parseFloat(b),
    // Array helper for generating number ranges: {{#each (array 1 2 3)}}
    array: (...args) => args.slice(0, -1), // last arg is Handlebars options object
    // Lookup helper: {{lookup obj key}}
    lookup: (obj, key) => obj ? obj[key] : undefined,
    // Less than or equal: {{#lte a b}}...{{/lte}}
    lte: (a, b) => {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return numA <= numB;
    },
    // Logical AND: {{and (cond1) (cond2)}}
    and: (a, b) => a && b,
    // String concat: {{concat a b}}
    concat: (a, b) => String(a) + String(b),
    // Logical OR: {{or a b}}
    or: (...args) => {
      const options = args[args.length - 1];
      // If called as block helper with options object
      if (options && typeof options.fn === 'function') {
        return args.slice(0, -1).some(Boolean) ? options.fn(this) : options.inverse(this);
      }
      // Called as inline helper
      return args.some(Boolean);
    },
    // Percentage helper: {{persentase nilai total}}
    persentase: (nilai, total) => {
      const n = parseFloat(nilai) || 0;
      const t = parseFloat(total) || 0;
      if (t === 0) return '0.00';
      return ((n / t) * 100).toFixed(2);
    }
  }
}))

// Set view engine ke Handlebars
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));



// Middleware untuk membuat session tersedia di semua view
app.use((req, res, next) => {
  res.locals.session = req.session;

  // Set role flags for easier access in views
  res.locals.isAdmin = req.session.peran === 'admin';
  res.locals.isDosen = req.session.peran === 'dosen';
  res.locals.isMahasiswa = req.session.peran === 'mahasiswa';

  next();
});

// load bootstrap dari node_modules
app.use('/bootstrap', 
  express.static(path.join(__dirname, 'node_modules/bootstrap/dist'))
);

// Route root — redirect ke dashboard sesuai role
app.get('/', isAuthenticated, (req, res) => {
  res.redirect('/dashboard');
});

app.use("/mata-kuliah", isAuthenticated, matakuliahRoutes);
app.use("/mahasiswa", isAuthenticated, authorize('admin'), mahasiswaRoutes);
app.use("/dosen", isAuthenticated, authorize('admin'), dosenRoutes);
app.use("/admin", isAuthenticated, authorize('admin'), adminRoutes);
app.use("/kelas", isAuthenticated, kelasRoutes);
app.use("/dashboard", isAuthenticated, dashboardRoutes);
app.use("/reports", isAuthenticated, reportRoutes);
app.use("/auth", authRoutes);
app.use("/absensi", isAuthenticated, authorize('admin', 'dosen'), absensiRoutes);

// jalankan server di port 3000
app.listen(3000, () => {
  transporter.verify().catch(err => {
    console.warn('Mail transporter not available:', err.message);
  });
  console.log('Server is running on http://localhost:3000');
});