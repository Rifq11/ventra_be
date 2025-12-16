"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ventraTransaksi = exports.ventraProdukDetail = exports.ventraProduk = exports.ventraKasir = exports.ventraEvent = exports.ventraDetailTransaksi = exports.ventraDetailEvent = exports.otpCodes = exports.categories = exports.admin = exports.absensi = void 0;
const mysql_core_1 = require("drizzle-orm/mysql-core");
// ========= All Tables from neoe3718_recode.sql =========
// Absensi
exports.absensi = (0, mysql_core_1.mysqlTable)('Absensi', {
    id: (0, mysql_core_1.int)('ID').primaryKey().autoincrement(),
    nama: (0, mysql_core_1.varchar)('Nama', { length: 100 }).notNull(),
    nisn: (0, mysql_core_1.varchar)('NISN', { length: 100 }).notNull(),
    kelas: (0, mysql_core_1.varchar)('Kelas', { length: 10 }).notNull(),
    jurusan: (0, mysql_core_1.varchar)('Jurusan', { length: 100 }).notNull(),
    androidId: (0, mysql_core_1.varchar)('AndroidID', { length: 100 }).notNull(),
    kehadiran: (0, mysql_core_1.varchar)('Kehadiran', { length: 10 }).notNull(),
    catatan: (0, mysql_core_1.varchar)('Catatan', { length: 100 }).notNull(),
    mood: (0, mysql_core_1.varchar)('Mood', { length: 10 }).notNull(),
    waktu: (0, mysql_core_1.timestamp)('Waktu', { fsp: 0 }).notNull().defaultNow(),
});
// admin
exports.admin = (0, mysql_core_1.mysqlTable)('admin', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    username: (0, mysql_core_1.varchar)('username', { length: 20 }).notNull(),
    password: (0, mysql_core_1.varchar)('password', { length: 250 }).notNull(),
    email: (0, mysql_core_1.varchar)('email', { length: 255 }).notNull(),
    resetTokenHash: (0, mysql_core_1.varchar)('reset_token_hash', { length: 64 }),
    resetTokenExpiresAt: (0, mysql_core_1.datetime)('reset_token_expires_at'),
});
// categories
exports.categories = (0, mysql_core_1.mysqlTable)('categories', {
    idKategori: (0, mysql_core_1.int)('id_kategori').primaryKey().autoincrement(),
    namaKategori: (0, mysql_core_1.varchar)('nama_kategori', { length: 100 }).notNull(),
});
// otp_codes
exports.otpCodes = (0, mysql_core_1.mysqlTable)('otp_codes', {
    email: (0, mysql_core_1.varchar)('email', { length: 255 }).primaryKey(),
    otp: (0, mysql_core_1.char)('otp', { length: 6 }).notNull(),
    expiry: (0, mysql_core_1.timestamp)('expiry', { fsp: 0 }).notNull().defaultNow(),
});
// ventra_detail_event
exports.ventraDetailEvent = (0, mysql_core_1.mysqlTable)('ventra_detail_event', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    idProduk: (0, mysql_core_1.int)('id_produk').notNull(),
    idEvent: (0, mysql_core_1.int)('id_event').notNull(),
});
// ventra_detail_transaksi
exports.ventraDetailTransaksi = (0, mysql_core_1.mysqlTable)('ventra_detail_transaksi', {
    id: (0, mysql_core_1.int)('ID').primaryKey().autoincrement(),
    idTransaksi: (0, mysql_core_1.varchar)('id_transaksi', { length: 50 }).notNull(),
    kodeBarang: (0, mysql_core_1.varchar)('kode_barang', { length: 50 }).notNull(),
    jumlah: (0, mysql_core_1.int)('JMLH').notNull(),
    harga: (0, mysql_core_1.int)('harga').notNull(),
    totalHarga: (0, mysql_core_1.int)('total_harga').notNull(),
    sisa: (0, mysql_core_1.int)('sisa').notNull().default(0),
});
// ventra_event
exports.ventraEvent = (0, mysql_core_1.mysqlTable)('ventra_event', {
    idEvent: (0, mysql_core_1.int)('id_event').primaryKey().autoincrement(),
    namaEvent: (0, mysql_core_1.varchar)('nama_event', { length: 255 }).notNull(),
    totalDiskon: (0, mysql_core_1.int)('total_diskon').notNull(),
    waktuAktif: (0, mysql_core_1.date)('waktu_aktif').notNull(),
    waktuNonAktif: (0, mysql_core_1.date)('waktu_non_aktif').notNull(),
});
// ventra_kasir
exports.ventraKasir = (0, mysql_core_1.mysqlTable)('ventra_kasir', {
    kodeKasir: (0, mysql_core_1.int)('kode_kasir').primaryKey().autoincrement(),
    nama: (0, mysql_core_1.varchar)('Nama', { length: 100 }).notNull(),
    waktuAktif: (0, mysql_core_1.date)('WaktuAktif').notNull(),
    waktuNonAktif: (0, mysql_core_1.date)('WaktuNonAktif').notNull(),
});
// ventra_produk
exports.ventraProduk = (0, mysql_core_1.mysqlTable)('ventra_produk', {
    id: (0, mysql_core_1.int)('id').primaryKey().autoincrement(),
    namaBrg: (0, mysql_core_1.varchar)('Nama_Brg', { length: 255 }).notNull(),
    bahan: (0, mysql_core_1.varchar)('Bahan', { length: 255 }).notNull(),
    hargaJual: (0, mysql_core_1.int)('harga_jual').notNull(),
    kategori: (0, mysql_core_1.int)('Kategori').notNull(),
    gambar: (0, mysql_core_1.text)('Gambar'),
});
// ventra_produk_detail
exports.ventraProdukDetail = (0, mysql_core_1.mysqlTable)('ventra_produk_detail', {
    kodeBrg: (0, mysql_core_1.varchar)('Kode_Brg', { length: 50 }).primaryKey(),
    produkId: (0, mysql_core_1.int)('produk_id'),
    ukuran: (0, mysql_core_1.varchar)('ukuran', { length: 50 }),
    pattern: (0, mysql_core_1.varchar)('pattern', { length: 100 }),
    barcode: (0, mysql_core_1.varchar)('barcode', { length: 255 }),
    stock: (0, mysql_core_1.int)('stock'),
});
// ventra_transaksi
exports.ventraTransaksi = (0, mysql_core_1.mysqlTable)('ventra_transaksi', {
    idTransaksi: (0, mysql_core_1.int)('ID_Transaksi').primaryKey().autoincrement(),
    total: (0, mysql_core_1.int)('Total').notNull(),
    payment: (0, mysql_core_1.varchar)('Payment', { length: 100 }).notNull(),
    kasir: (0, mysql_core_1.varchar)('Kasir', { length: 100 }).notNull(),
    uangDibayar: (0, mysql_core_1.int)('uang_dibayar').notNull(),
    noRek: (0, mysql_core_1.varchar)('no_rek', { length: 20 }).notNull(),
    tanggalTransaksi: (0, mysql_core_1.timestamp)('tanggal_transaksi', { fsp: 0 })
        .notNull()
        .defaultNow(),
});
