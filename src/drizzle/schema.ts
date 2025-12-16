import {
  mysqlTable,
  int,
  varchar,
  text,
  date,
  timestamp,
  datetime,
  char,
} from 'drizzle-orm/mysql-core';

// ========= All Tables from neoe3718_recode.sql =========

// Absensi
export const absensi = mysqlTable('Absensi', {
  id: int('ID').primaryKey().autoincrement(),
  nama: varchar('Nama', { length: 100 }).notNull(),
  nisn: varchar('NISN', { length: 100 }).notNull(),
  kelas: varchar('Kelas', { length: 10 }).notNull(),
  jurusan: varchar('Jurusan', { length: 100 }).notNull(),
  androidId: varchar('AndroidID', { length: 100 }).notNull(),
  kehadiran: varchar('Kehadiran', { length: 10 }).notNull(),
  catatan: varchar('Catatan', { length: 100 }).notNull(),
  mood: varchar('Mood', { length: 10 }).notNull(),
  waktu: timestamp('Waktu', { fsp: 0 }).notNull().defaultNow(),
});

// admin
export const admin = mysqlTable('admin', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 20 }).notNull(),
  password: varchar('password', { length: 250 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  resetTokenHash: varchar('reset_token_hash', { length: 64 }),
  resetTokenExpiresAt: datetime('reset_token_expires_at'),
});

// categories
export const categories = mysqlTable('categories', {
  idKategori: int('id_kategori').primaryKey().autoincrement(),
  namaKategori: varchar('nama_kategori', { length: 100 }).notNull(),
});

// otp_codes
export const otpCodes = mysqlTable('otp_codes', {
  email: varchar('email', { length: 255 }).primaryKey(),
  otp: char('otp', { length: 6 }).notNull(),
  expiry: timestamp('expiry', { fsp: 0 }).notNull().defaultNow(),
});

// ventra_detail_event
export const ventraDetailEvent = mysqlTable('ventra_detail_event', {
  id: int('id').primaryKey().autoincrement(),
  idProduk: int('id_produk').notNull(),
  idEvent: int('id_event').notNull(),
});

// ventra_detail_transaksi
export const ventraDetailTransaksi = mysqlTable('ventra_detail_transaksi', {
  id: int('ID').primaryKey().autoincrement(),
  idTransaksi: varchar('id_transaksi', { length: 50 }).notNull(),
  kodeBarang: varchar('kode_barang', { length: 50 }).notNull(),
  jumlah: int('JMLH').notNull(),
  harga: int('harga').notNull(),
  totalHarga: int('total_harga').notNull(),
  sisa: int('sisa').notNull().default(0),
});

// ventra_event
export const ventraEvent = mysqlTable('ventra_event', {
  idEvent: int('id_event').primaryKey().autoincrement(),
  namaEvent: varchar('nama_event', { length: 255 }).notNull(),
  totalDiskon: int('total_diskon').notNull(),
  waktuAktif: date('waktu_aktif').notNull(),
  waktuNonAktif: date('waktu_non_aktif').notNull(),
});

// ventra_kasir
export const ventraKasir = mysqlTable('ventra_kasir', {
  kodeKasir: int('kode_kasir').primaryKey().autoincrement(),
  nama: varchar('Nama', { length: 100 }).notNull(),
  waktuAktif: date('WaktuAktif').notNull(),
  waktuNonAktif: date('WaktuNonAktif').notNull(),
});

// ventra_produk
export const ventraProduk = mysqlTable('ventra_produk', {
  id: int('id').primaryKey().autoincrement(),
  namaBrg: varchar('Nama_Brg', { length: 255 }).notNull(),
  bahan: varchar('Bahan', { length: 255 }).notNull(),
  hargaJual: int('harga_jual').notNull(),
  kategori: int('Kategori').notNull(),
  gambar: text('Gambar'),
});

// ventra_produk_detail
export const ventraProdukDetail = mysqlTable('ventra_produk_detail', {
  kodeBrg: varchar('Kode_Brg', { length: 50 }).primaryKey(),
  produkId: int('produk_id'),
  ukuran: varchar('ukuran', { length: 50 }),
  pattern: varchar('pattern', { length: 100 }),
  barcode: varchar('barcode', { length: 255 }),
  stock: int('stock'),
});

// ventra_transaksi
export const ventraTransaksi = mysqlTable('ventra_transaksi', {
  idTransaksi: int('ID_Transaksi').primaryKey().autoincrement(),
  total: int('Total').notNull(),
  payment: varchar('Payment', { length: 100 }).notNull(),
  kasir: varchar('Kasir', { length: 100 }).notNull(),
  uangDibayar: int('uang_dibayar').notNull(),
  noRek: varchar('no_rek', { length: 20 }).notNull(),
  tanggalTransaksi: timestamp('tanggal_transaksi', { fsp: 0 })
    .notNull()
    .defaultNow(),
});


