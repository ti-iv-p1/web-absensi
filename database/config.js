const Database = require('better-sqlite3');
const db = new Database('absensi-ibbi.db');

module.exports = db;