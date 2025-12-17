"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const drizzle_1 = __importDefault(require("../../config/drizzle"));
const db_1 = __importDefault(require("../../config/db"));
const schema_1 = require("../../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
exports.TransactionsService = {
    async getTransactions(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const rows = await drizzle_1.default
            .select({
            id_transaksi: schema_1.ventraDetailTransaksi.idTransaksi,
            total_items: (0, drizzle_orm_1.sql) `COUNT(${schema_1.ventraDetailTransaksi.id})`.as('total_items'),
            total_amount: (0, drizzle_orm_1.sql) `SUM(${schema_1.ventraDetailTransaksi.totalHarga})`.as('total_amount'),
            first_item_id: (0, drizzle_orm_1.sql) `MIN(${schema_1.ventraDetailTransaksi.id})`.as('first_item_id'),
        })
            .from(schema_1.ventraDetailTransaksi)
            .groupBy(schema_1.ventraDetailTransaksi.idTransaksi)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.ventraDetailTransaksi.idTransaksi))
            .limit(limit)
            .offset(offset);
        return rows;
    },
    async getTransactionById(id) {
        const today = (0, drizzle_orm_1.sql) `CURDATE()`;
        const rows = await drizzle_1.default
            .select({
            ID_Transaksi: schema_1.ventraTransaksi.idTransaksi,
            Nama_Brg: schema_1.ventraProduk.namaBrg,
            Ukuran_Produk: schema_1.ventraProdukDetail.ukuran,
            Harga_Produk_Asli: schema_1.ventraProduk.hargaJual,
            JMLH: schema_1.ventraDetailTransaksi.jumlah,
            Subtotal: schema_1.ventraDetailTransaksi.totalHarga,
            Potongan_Harga: (0, drizzle_orm_1.sql) `COALESCE(${schema_1.ventraProduk.hargaJual} * COALESCE(${schema_1.ventraEvent.totalDiskon}, 0) / 100, 0)`.as('Potongan_Harga'),
            Harga_Setelah_Diskon: (0, drizzle_orm_1.sql) `ROUND(${schema_1.ventraProduk.hargaJual} - (${schema_1.ventraProduk.hargaJual} * COALESCE(${schema_1.ventraEvent.totalDiskon}, 0) / 100))`.as('Harga_Setelah_Diskon'),
            Total_Transaksi: schema_1.ventraTransaksi.total,
            Total_Payment: schema_1.ventraTransaksi.payment,
            Nama_Kasir: schema_1.ventraTransaksi.kasir,
            Uang_Dibayar: schema_1.ventraTransaksi.uangDibayar,
            Nomor_Rekening: schema_1.ventraTransaksi.noRek,
            Tanggal_Transaksi: schema_1.ventraTransaksi.tanggalTransaksi,
        })
            .from(schema_1.ventraTransaksi)
            .innerJoin(schema_1.ventraDetailTransaksi, (0, drizzle_orm_1.sql) `${schema_1.ventraTransaksi.idTransaksi} = CAST(${schema_1.ventraDetailTransaksi.idTransaksi} AS UNSIGNED)`)
            .innerJoin(schema_1.ventraProdukDetail, (0, drizzle_orm_1.eq)(schema_1.ventraDetailTransaksi.kodeBarang, schema_1.ventraProdukDetail.kodeBrg))
            .innerJoin(schema_1.ventraProduk, (0, drizzle_orm_1.eq)(schema_1.ventraProdukDetail.produkId, schema_1.ventraProduk.id))
            .leftJoin(schema_1.ventraDetailEvent, (0, drizzle_orm_1.eq)(schema_1.ventraProdukDetail.produkId, schema_1.ventraDetailEvent.idProduk))
            .leftJoin(schema_1.ventraEvent, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ventraDetailEvent.idEvent, schema_1.ventraEvent.idEvent), (0, drizzle_orm_1.sql) `${today} BETWEEN ${schema_1.ventraEvent.waktuAktif} AND ${schema_1.ventraEvent.waktuNonAktif}`))
            .where((0, drizzle_orm_1.eq)(schema_1.ventraTransaksi.idTransaksi, id));
        if (rows.length === 0) {
            return null;
        }
        return rows;
    },
    async getLatestTransaction() {
        const today = (0, drizzle_orm_1.sql) `CURDATE()`;
        const maxIdResult = await drizzle_1.default
            .select({ maxId: (0, drizzle_orm_1.max)(schema_1.ventraTransaksi.idTransaksi) })
            .from(schema_1.ventraTransaksi);
        const maxId = maxIdResult[0]?.maxId;
        if (!maxId) {
            return [];
        }
        const rows = await drizzle_1.default
            .select({
            ID_Transaksi: schema_1.ventraTransaksi.idTransaksi,
            Nama_Brg: schema_1.ventraProduk.namaBrg,
            Ukuran_Produk: schema_1.ventraProdukDetail.ukuran,
            Harga_Produk_Asli: schema_1.ventraProduk.hargaJual,
            JMLH: schema_1.ventraDetailTransaksi.jumlah,
            Subtotal: schema_1.ventraDetailTransaksi.totalHarga,
            Potongan_Harga: (0, drizzle_orm_1.sql) `COALESCE(${schema_1.ventraProduk.hargaJual} * COALESCE(${schema_1.ventraEvent.totalDiskon}, 0) / 100, 0)`.as('Potongan_Harga'),
            Harga_Setelah_Diskon: (0, drizzle_orm_1.sql) `ROUND(${schema_1.ventraProduk.hargaJual} - (${schema_1.ventraProduk.hargaJual} * COALESCE(${schema_1.ventraEvent.totalDiskon}, 0) / 100))`.as('Harga_Setelah_Diskon'),
            Total_Transaksi: schema_1.ventraTransaksi.total,
            Total_Payment: schema_1.ventraTransaksi.payment,
            Nama_Kasir: schema_1.ventraTransaksi.kasir,
            Uang_Dibayar: schema_1.ventraTransaksi.uangDibayar,
            Nomor_Rekening: schema_1.ventraTransaksi.noRek,
            Tanggal_Transaksi: schema_1.ventraTransaksi.tanggalTransaksi,
        })
            .from(schema_1.ventraTransaksi)
            .innerJoin(schema_1.ventraDetailTransaksi, (0, drizzle_orm_1.sql) `${schema_1.ventraTransaksi.idTransaksi} = CAST(${schema_1.ventraDetailTransaksi.idTransaksi} AS UNSIGNED)`)
            .innerJoin(schema_1.ventraProdukDetail, (0, drizzle_orm_1.eq)(schema_1.ventraDetailTransaksi.kodeBarang, schema_1.ventraProdukDetail.kodeBrg))
            .innerJoin(schema_1.ventraProduk, (0, drizzle_orm_1.eq)(schema_1.ventraProdukDetail.produkId, schema_1.ventraProduk.id))
            .leftJoin(schema_1.ventraDetailEvent, (0, drizzle_orm_1.eq)(schema_1.ventraProdukDetail.produkId, schema_1.ventraDetailEvent.idProduk))
            .leftJoin(schema_1.ventraEvent, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ventraDetailEvent.idEvent, schema_1.ventraEvent.idEvent), (0, drizzle_orm_1.sql) `${today} BETWEEN ${schema_1.ventraEvent.waktuAktif} AND ${schema_1.ventraEvent.waktuNonAktif}`))
            .where((0, drizzle_orm_1.eq)(schema_1.ventraTransaksi.idTransaksi, maxId));
        return rows;
    },
    async createTransaction(payload) {
        if (Number.isNaN(payload.total)) {
            throw new Error('Total must be numeric');
        }
        const connection = await db_1.default.getConnection();
        try {
            await connection.query('SET TRANSACTION ISOLATION LEVEL SERIALIZABLE');
            await connection.beginTransaction();
            console.log(`[TRANSACTION START] Total: ${payload.total}, Payment: ${payload.payment}, Kasir: ${payload.kasir}, Detail count: ${payload.detail.length}`);
            const uangDibayar = payload.uang_dibayar && !Number.isNaN(payload.uang_dibayar)
                ? payload.uang_dibayar
                : payload.total;
            const [insertResult] = await connection.query(`INSERT INTO ventra_transaksi (Total, Payment, Kasir, uang_dibayar, no_rek) VALUES (?, ?, ?, ?, ?)`, [payload.total, payload.payment, payload.kasir, uangDibayar, payload.no_rek || '']);
            const nextId = insertResult.insertId;
            console.log(`[TRANSACTION ${nextId}] Created transaction with ID: ${nextId}`);
            for (const item of payload.detail) {
                if (Number.isNaN(item.jumlah) ||
                    Number.isNaN(item.harga)) {
                    throw new Error(`Jumlah atau harga tidak valid pada item: ${item.kode_barang}`);
                }
                const [existingDetail] = await connection.query(`SELECT * FROM ventra_detail_transaksi WHERE id_transaksi = ? AND kode_barang = ?`, [String(nextId), item.kode_barang]);
                console.log(`[TRANSACTION ${nextId}] ${item.kode_barang}: Existing detail count = ${existingDetail.length}`);
                if (existingDetail.length > 0) {
                    console.log(`[TRANSACTION ${nextId}] ${item.kode_barang}: SKIPPED - Already exists`);
                    continue;
                }
                // Ambil stock dari detail transaksi terakhir (field sisa) sebagai source of truth
                // Jika tidak ada, ambil dari ventra_produk_detail
                const [lastDetailResult] = await connection.query(`SELECT sisa FROM ventra_detail_transaksi WHERE kode_barang = ? ORDER BY ID DESC LIMIT 1 FOR UPDATE`, [item.kode_barang]);
                let stokSebelum;
                if (lastDetailResult && lastDetailResult.length > 0 && lastDetailResult[0].sisa !== null) {
                    // Gunakan sisa dari detail transaksi terakhir
                    stokSebelum = Number(lastDetailResult[0].sisa);
                    console.log(`[TRANSACTION ${nextId}] ${item.kode_barang}: Stock dari detail transaksi terakhir (sisa) = ${stokSebelum}`);
                }
                else {
                    // Jika belum ada transaksi sebelumnya, ambil dari ventra_produk_detail
                    const [stockResult] = await connection.query(`SELECT stock FROM ventra_produk_detail WHERE Kode_Brg = ? FOR UPDATE`, [item.kode_barang]);
                    stokSebelum = stockResult[0]?.stock ? Number(stockResult[0].stock) : 0;
                    console.log(`[TRANSACTION ${nextId}] ${item.kode_barang}: Stock dari ventra_produk_detail = ${stokSebelum}`);
                }
                console.log(`[TRANSACTION ${nextId}] ${item.kode_barang}: Stock sebelum = ${stokSebelum}, Jumlah = ${item.jumlah}`);
                if (stokSebelum < item.jumlah) {
                    throw new Error(`Stock tidak cukup untuk ${item.kode_barang}. Stock tersedia: ${stokSebelum}, dibutuhkan: ${item.jumlah}`);
                }
                const sisaStok = stokSebelum - item.jumlah;
                // Insert detail transaction dengan sisa stock yang sudah dikurangi
                await connection.query(`INSERT INTO ventra_detail_transaksi (id_transaksi, kode_barang, JMLH, harga, total_harga, sisa) VALUES (?, ?, ?, ?, ?, ?)`, [String(nextId), item.kode_barang, item.jumlah, item.harga, item.total_harga, sisaStok]);
                console.log(`[TRANSACTION ${nextId}] ${item.kode_barang}: Detail inserted dengan sisa = ${sisaStok}`);
                // Update stock di ventra_produk_detail untuk sinkronisasi (bukan untuk perhitungan)
                const [updateResult] = await connection.query(`UPDATE ventra_produk_detail SET stock = ? WHERE Kode_Brg = ?`, [sisaStok, item.kode_barang]);
                console.log(`[TRANSACTION ${nextId}] ${item.kode_barang}: Updated ventra_produk_detail.stock = ${sisaStok}, affectedRows = ${updateResult?.affectedRows}`);
            }
            await connection.commit();
            return {
                id: nextId
            };
        }
        catch (error) {
            await connection.rollback();
            console.error(`[TRANSACTION ERROR] Rollback:`, error);
            throw error;
        }
        finally {
            connection.release();
        }
    },
    async deleteLatestTransaction() {
        return await drizzle_1.default.transaction(async (tx) => {
            const maxIdResult = await tx
                .select({ maxId: (0, drizzle_orm_1.max)(schema_1.ventraTransaksi.idTransaksi) })
                .from(schema_1.ventraTransaksi);
            const id_transaksi = maxIdResult[0]?.maxId ? Number(maxIdResult[0].maxId) : null;
            if (!id_transaksi) {
                return {
                    error: true,
                    message: 'Tidak ada transaksi untuk dihapus'
                };
            }
            const detailRows = await tx
                .select({
                kode_barang: schema_1.ventraDetailTransaksi.kodeBarang,
                jumlah: schema_1.ventraDetailTransaksi.jumlah,
            })
                .from(schema_1.ventraDetailTransaksi)
                .where((0, drizzle_orm_1.eq)(schema_1.ventraDetailTransaksi.idTransaksi, String(id_transaksi)));
            const restoredItems = [];
            for (const detail of detailRows) {
                const kode_barang = detail.kode_barang;
                const jumlah = Number(detail.jumlah);
                await tx
                    .update(schema_1.ventraProdukDetail)
                    .set({ stock: (0, drizzle_orm_1.sql) `${schema_1.ventraProdukDetail.stock} + ${jumlah}` })
                    .where((0, drizzle_orm_1.eq)(schema_1.ventraProdukDetail.kodeBrg, kode_barang));
                restoredItems.push({ kode: kode_barang, jumlah });
            }
            await tx
                .delete(schema_1.ventraDetailTransaksi)
                .where((0, drizzle_orm_1.eq)(schema_1.ventraDetailTransaksi.idTransaksi, String(id_transaksi)));
            await tx
                .delete(schema_1.ventraTransaksi)
                .where((0, drizzle_orm_1.eq)(schema_1.ventraTransaksi.idTransaksi, id_transaksi));
            return {
                error: false,
                transaction_id: id_transaksi,
                restored_items: restoredItems
            };
        });
    }
};
