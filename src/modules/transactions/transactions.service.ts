import db from '../../config/drizzle';
import pool from '../../config/db';
import { 
    ventraTransaksi, 
    ventraDetailTransaksi, 
    ventraProdukDetail,
    ventraProduk,
    ventraEvent,
    ventraDetailEvent
} from '../../drizzle/schema';
import { eq, sql, desc, max, and, gte, lte } from 'drizzle-orm';
import { RowDataPacket } from 'mysql2';

export const TransactionsService = {
    async getTransactions(page: number = 1, limit: number = 10) {
        const offset = (page - 1) * limit;

        const rows = await db
            .select({
                id_transaksi: ventraDetailTransaksi.idTransaksi,
                total_items: sql<number>`COUNT(${ventraDetailTransaksi.id})`.as('total_items'),
                total_amount: sql<number>`SUM(${ventraDetailTransaksi.totalHarga})`.as('total_amount'),
                first_item_id: sql<number>`MIN(${ventraDetailTransaksi.id})`.as('first_item_id'),
            })
            .from(ventraDetailTransaksi)
            .groupBy(ventraDetailTransaksi.idTransaksi)
            .orderBy(desc(ventraDetailTransaksi.idTransaksi))
            .limit(limit)
            .offset(offset);

        return rows;
    },

    async getTransactionById(id: number) {
        const today = sql<string>`CURDATE()`;

        const rows = await db
            .select({
                ID_Transaksi: ventraTransaksi.idTransaksi,
                Nama_Brg: ventraProduk.namaBrg,
                Ukuran_Produk: ventraProdukDetail.ukuran,
                Harga_Produk_Asli: ventraProduk.hargaJual,
                JMLH: ventraDetailTransaksi.jumlah,
                Subtotal: ventraDetailTransaksi.totalHarga,
                Potongan_Harga: sql<number>`COALESCE(${ventraProduk.hargaJual} * COALESCE(${ventraEvent.totalDiskon}, 0) / 100, 0)`.as('Potongan_Harga'),
                Harga_Setelah_Diskon: sql<number>`ROUND(${ventraProduk.hargaJual} - (${ventraProduk.hargaJual} * COALESCE(${ventraEvent.totalDiskon}, 0) / 100))`.as('Harga_Setelah_Diskon'),
                Total_Transaksi: ventraTransaksi.total,
                Total_Payment: ventraTransaksi.payment,
                Nama_Kasir: ventraTransaksi.kasir,
                Uang_Dibayar: ventraTransaksi.uangDibayar,
                Nomor_Rekening: ventraTransaksi.noRek,
                Tanggal_Transaksi: ventraTransaksi.tanggalTransaksi,
            })
            .from(ventraTransaksi)
            .innerJoin(ventraDetailTransaksi, sql`${ventraTransaksi.idTransaksi} = CAST(${ventraDetailTransaksi.idTransaksi} AS UNSIGNED)`)
            .innerJoin(ventraProdukDetail, eq(ventraDetailTransaksi.kodeBarang, ventraProdukDetail.kodeBrg))
            .innerJoin(ventraProduk, eq(ventraProdukDetail.produkId, ventraProduk.id))
            .leftJoin(ventraDetailEvent, eq(ventraProdukDetail.produkId, ventraDetailEvent.idProduk))
            .leftJoin(ventraEvent, and(
                eq(ventraDetailEvent.idEvent, ventraEvent.idEvent),
                sql`${today} BETWEEN ${ventraEvent.waktuAktif} AND ${ventraEvent.waktuNonAktif}`
            ))
            .where(eq(ventraTransaksi.idTransaksi, id));

        if (rows.length === 0) {
            return null;
        }

        return rows;
    },

    async getLatestTransaction() {
        const today = sql<string>`CURDATE()`;

        const maxIdResult = await db
            .select({ maxId: max(ventraTransaksi.idTransaksi) })
            .from(ventraTransaksi);

        const maxId = maxIdResult[0]?.maxId;
        if (!maxId) {
            return [];
        }

        const rows = await db
            .select({
                ID_Transaksi: ventraTransaksi.idTransaksi,
                Nama_Brg: ventraProduk.namaBrg,
                Ukuran_Produk: ventraProdukDetail.ukuran,
                Harga_Produk_Asli: ventraProduk.hargaJual,
                JMLH: ventraDetailTransaksi.jumlah,
                Subtotal: ventraDetailTransaksi.totalHarga,
                Potongan_Harga: sql<number>`COALESCE(${ventraProduk.hargaJual} * COALESCE(${ventraEvent.totalDiskon}, 0) / 100, 0)`.as('Potongan_Harga'),
                Harga_Setelah_Diskon: sql<number>`ROUND(${ventraProduk.hargaJual} - (${ventraProduk.hargaJual} * COALESCE(${ventraEvent.totalDiskon}, 0) / 100))`.as('Harga_Setelah_Diskon'),
                Total_Transaksi: ventraTransaksi.total,
                Total_Payment: ventraTransaksi.payment,
                Nama_Kasir: ventraTransaksi.kasir,
                Uang_Dibayar: ventraTransaksi.uangDibayar,
                Nomor_Rekening: ventraTransaksi.noRek,
                Tanggal_Transaksi: ventraTransaksi.tanggalTransaksi,
            })
            .from(ventraTransaksi)
            .innerJoin(ventraDetailTransaksi, sql`${ventraTransaksi.idTransaksi} = CAST(${ventraDetailTransaksi.idTransaksi} AS UNSIGNED)`)
            .innerJoin(ventraProdukDetail, eq(ventraDetailTransaksi.kodeBarang, ventraProdukDetail.kodeBrg))
            .innerJoin(ventraProduk, eq(ventraProdukDetail.produkId, ventraProduk.id))
            .leftJoin(ventraDetailEvent, eq(ventraProdukDetail.produkId, ventraDetailEvent.idProduk))
            .leftJoin(ventraEvent, and(
                eq(ventraDetailEvent.idEvent, ventraEvent.idEvent),
                sql`${today} BETWEEN ${ventraEvent.waktuAktif} AND ${ventraEvent.waktuNonAktif}`
            ))
            .where(eq(ventraTransaksi.idTransaksi, maxId));

        return rows;
    },

    async createTransaction(payload: {
        total: number;
        payment: string;
        detail: {
            kode_barang: string;
            jumlah: number;
            harga: number;
            total_harga: number;
        }[];
        kasir: string;
        uang_dibayar?: number;
        no_rek?: string | null;
    }) {
        if (Number.isNaN(payload.total)) {
            throw new Error('Total must be numeric');
        }

        // Use raw connection pool for better transaction control and SELECT FOR UPDATE
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();

            const uangDibayar =
                payload.uang_dibayar && !Number.isNaN(payload.uang_dibayar)
                    ? payload.uang_dibayar
                    : payload.total;

            // Insert transaction using raw query
            const [insertResult] = await connection.query(
                `INSERT INTO ventra_transaksi (Total, Payment, Kasir, uang_dibayar, no_rek) VALUES (?, ?, ?, ?, ?)`,
                [payload.total, payload.payment, payload.kasir, uangDibayar, payload.no_rek || '']
            ) as any;

            const nextId = insertResult.insertId;

            for (const item of payload.detail) {
                if (
                    Number.isNaN(item.jumlah) ||
                    Number.isNaN(item.harga)
                ) {
                    throw new Error(
                        `Jumlah atau harga tidak valid pada item: ${item.kode_barang}`
                    );
                }

                // Check if detail already exists to prevent duplicate processing
                const [existingDetail] = await connection.query(
                    `SELECT * FROM ventra_detail_transaksi WHERE id_transaksi = ? AND kode_barang = ?`,
                    [String(nextId), item.kode_barang]
                ) as RowDataPacket[];

                if (existingDetail.length > 0) {
                    // Skip if already processed (idempotency)
                    continue;
                }

                // Use SELECT FOR UPDATE to lock row and prevent race condition
                const [stockResult] = await connection.query(
                    `SELECT stock FROM ventra_produk_detail WHERE Kode_Brg = ? FOR UPDATE`,
                    [item.kode_barang]
                ) as RowDataPacket[];

                const stokSebelum = stockResult[0]?.stock ? Number(stockResult[0].stock) : 0;
                
                console.log(`[DEBUG] ${item.kode_barang}: Stock sebelum = ${stokSebelum}, Jumlah = ${item.jumlah}`);
                
                if (stokSebelum < item.jumlah) {
                    throw new Error(
                        `Stock tidak cukup untuk ${item.kode_barang}. Stock tersedia: ${stokSebelum}, dibutuhkan: ${item.jumlah}`
                    );
                }

                const sisaStok = stokSebelum - item.jumlah;

                // Update stock using atomic operation: stock = stock - jumlah
                // This ensures that even if multiple requests come, only one will succeed
                const [updateResult] = await connection.query(
                    `UPDATE ventra_produk_detail SET stock = stock - ? WHERE Kode_Brg = ? AND stock >= ?`,
                    [item.jumlah, item.kode_barang, item.jumlah]
                ) as any;

                console.log(`[DEBUG] ${item.kode_barang}: Update affectedRows = ${updateResult?.affectedRows}, changedRows = ${updateResult?.changedRows}`);

                // Check if update was successful (affectedRows > 0)
                if (!updateResult || updateResult.affectedRows === 0) {
                    throw new Error(
                        `Gagal update stock untuk ${item.kode_barang}. Stock mungkin tidak cukup atau sudah berubah.`
                    );
                }

                // Verify the final stock after update
                const [verifyResult] = await connection.query(
                    `SELECT stock FROM ventra_produk_detail WHERE Kode_Brg = ?`,
                    [item.kode_barang]
                ) as RowDataPacket[];
                
                const stockSetelah = verifyResult[0]?.stock ? Number(verifyResult[0].stock) : 0;
                console.log(`[DEBUG] ${item.kode_barang}: Stock setelah = ${stockSetelah}, Expected = ${sisaStok}`);
                
                if (stockSetelah !== sisaStok) {
                    console.error(`[ERROR] ${item.kode_barang}: Stock mismatch! Expected ${sisaStok}, got ${stockSetelah}`);
                }

                // Insert detail transaction
                await connection.query(
                    `INSERT INTO ventra_detail_transaksi (id_transaksi, kode_barang, JMLH, harga, total_harga, sisa) VALUES (?, ?, ?, ?, ?, ?)`,
                    [String(nextId), item.kode_barang, item.jumlah, item.harga, item.total_harga, sisaStok]
                );
            }

            await connection.commit();

            return {
                id: nextId
            };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    },

    async deleteLatestTransaction() {
        return await db.transaction(async (tx) => {
            const maxIdResult = await tx
                .select({ maxId: max(ventraTransaksi.idTransaksi) })
                .from(ventraTransaksi);

            const id_transaksi = maxIdResult[0]?.maxId ? Number(maxIdResult[0].maxId) : null;

            if (!id_transaksi) {
                return {
                    error: true,
                    message: 'Tidak ada transaksi untuk dihapus'
                };
            }

            const detailRows = await tx
                .select({
                    kode_barang: ventraDetailTransaksi.kodeBarang,
                    jumlah: ventraDetailTransaksi.jumlah,
                })
                .from(ventraDetailTransaksi)
                .where(eq(ventraDetailTransaksi.idTransaksi, String(id_transaksi)));

            const restoredItems: { kode: string; jumlah: number }[] = [];

            for (const detail of detailRows) {
                const kode_barang = detail.kode_barang;
                const jumlah = Number(detail.jumlah);

                await tx
                    .update(ventraProdukDetail)
                    .set({ stock: sql`${ventraProdukDetail.stock} + ${jumlah}` })
                    .where(eq(ventraProdukDetail.kodeBrg, kode_barang));

                restoredItems.push({ kode: kode_barang, jumlah });
            }

            await tx
                .delete(ventraDetailTransaksi)
                .where(eq(ventraDetailTransaksi.idTransaksi, String(id_transaksi)));

            await tx
                .delete(ventraTransaksi)
                .where(eq(ventraTransaksi.idTransaksi, id_transaksi));

            return {
                error: false,
                transaction_id: id_transaksi,
                restored_items: restoredItems
            };
        });
    }
};
