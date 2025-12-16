import pool from '../../config/db';
import { PoolConnection, RowDataPacket } from 'mysql2/promise';

export const TransactionsService = {
    async getTransactions(page: number = 1, limit: number = 10) {
        const offset = (page - 1) * limit;

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                dt.id_transaksi,
                COUNT(dt.ID) as total_items,
                SUM(dt.total_harga) as total_amount,
                MIN(dt.ID) as first_item_id
            FROM ventra_detail_transaksi dt
            GROUP BY dt.id_transaksi
            ORDER BY dt.id_transaksi DESC
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return rows;
    },

    // Mirror PHP: GET by id returns array rows or error
    async getTransactionById(id: number) {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                t.ID_Transaksi, 
                p.Nama_Brg, 
                pd.ukuran AS Ukuran_Produk,
                p.harga_jual AS Harga_Produk_Asli, 
                dt.JMLH, 
                dt.total_harga AS Subtotal,
                COALESCE(p.harga_jual * COALESCE(e.total_diskon, 0) / 100, 0) AS Potongan_Harga,
                ROUND(p.harga_jual - (p.harga_jual * COALESCE(e.total_diskon, 0) / 100)) AS Harga_Setelah_Diskon,
                t.Total AS Total_Transaksi, 
                t.Payment AS Total_Payment, 
                t.Kasir AS Nama_Kasir, 
                t.uang_dibayar AS Uang_Dibayar,
                t.no_rek AS Nomor_Rekening, 
                t.tanggal_transaksi AS Tanggal_Transaksi
            FROM ventra_transaksi t
            JOIN ventra_detail_transaksi dt ON t.ID_Transaksi = dt.id_transaksi
            JOIN ventra_produk_detail pd ON dt.kode_barang = pd.Kode_Brg
            JOIN ventra_produk p ON pd.produk_id = p.id
            LEFT JOIN ventra_event e 
                ON CURDATE() BETWEEN e.waktu_aktif AND e.waktu_non_aktif
            WHERE t.ID_Transaksi = ?`,
            [id]
        );

        if (rows.length === 0) {
            return null;
        }

        return rows;
    },

    async getLatestTransaction() {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                t.ID_Transaksi, 
                p.Nama_Brg, 
                pd.ukuran AS Ukuran_Produk,
                p.harga_jual AS Harga_Produk_Asli, 
                dt.JMLH, 
                dt.total_harga AS Subtotal,
                COALESCE(p.harga_jual * COALESCE(e.total_diskon, 0) / 100, 0) AS Potongan_Harga,
                ROUND(p.harga_jual - (p.harga_jual * COALESCE(e.total_diskon, 0) / 100)) AS Harga_Setelah_Diskon,
                t.Total AS Total_Transaksi, 
                t.Payment AS Total_Payment, 
                t.Kasir AS Nama_Kasir, 
                t.uang_dibayar AS Uang_Dibayar,
                t.no_rek AS Nomor_Rekening, 
                t.tanggal_transaksi AS Tanggal_Transaksi
            FROM ventra_transaksi t
            JOIN ventra_detail_transaksi dt ON t.ID_Transaksi = dt.id_transaksi
            JOIN ventra_produk_detail pd ON dt.kode_barang = pd.Kode_Brg
            JOIN ventra_produk p ON pd.produk_id = p.id
            LEFT JOIN ventra_event e 
                ON CURDATE() BETWEEN e.waktu_aktif AND e.waktu_non_aktif
            WHERE t.ID_Transaksi = (
                SELECT MAX(ID_Transaksi) FROM ventra_transaksi
            )`
        );

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

        let connection: PoolConnection | null = null;

        try {
            connection = await pool.getConnection();
            await connection.beginTransaction();

            const [maxRows] = await connection.query<RowDataPacket[]>(
                'SELECT MAX(ID_Transaksi) AS max_id FROM ventra_transaksi'
            );
            const nextId =
                maxRows.length && maxRows[0].max_id
                    ? Number(maxRows[0].max_id) + 1
                    : 1;

            const uangDibayar =
                payload.uang_dibayar && !Number.isNaN(payload.uang_dibayar)
                    ? payload.uang_dibayar
                    : payload.total;

            await connection.query(
                `INSERT INTO ventra_transaksi 
                    (ID_Transaksi, Total, Payment, Kasir, uang_dibayar, no_rek)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    nextId,
                    payload.total,
                    payload.payment,
                    payload.kasir,
                    uangDibayar,
                    payload.no_rek || null
                ]
            );

            for (const item of payload.detail) {
                if (
                    Number.isNaN(item.jumlah) ||
                    Number.isNaN(item.harga)
                ) {
                    throw new Error(
                        `Jumlah atau harga tidak valid pada item: ${item.kode_barang}`
                    );
                }

                const [stokRows] = await connection.query<RowDataPacket[]>(
                    'SELECT stock FROM ventra_produk_detail WHERE Kode_Brg = ?',
                    [item.kode_barang]
                );

                const stokSebelum =
                    stokRows.length && stokRows[0].stock
                        ? Number(stokRows[0].stock)
                        : 0;
                const sisaStok = stokSebelum - item.jumlah;

                await connection.query(
                    `INSERT INTO ventra_detail_transaksi 
                        (id_transaksi, kode_barang, JMLH, harga, total_harga, sisa)
                     VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        nextId,
                        item.kode_barang,
                        item.jumlah,
                        item.harga,
                        item.total_harga,
                        sisaStok
                    ]
                );

                // Catatan: sama seperti PHP, update stok produk disimpan sebagai "sisa" saja,
                // kalau nanti mau aktifkan update stok, bisa tambahkan UPDATE di sini.
            }

            await connection.commit();

            return {
                id: nextId
            };
        } catch (err) {
            if (connection) {
                await connection.rollback();
            }
            throw err;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    },

    async deleteLatestTransaction() {
        let connection: PoolConnection | null = null;

        try {
            connection = await pool.getConnection();

            const [maxRows] = await connection.query<RowDataPacket[]>(
                'SELECT MAX(ID_Transaksi) AS max_id FROM ventra_transaksi'
            );
            const id_transaksi =
                maxRows.length && maxRows[0].max_id
                    ? Number(maxRows[0].max_id)
                    : null;

            if (!id_transaksi) {
                return {
                    error: true,
                    message: 'Tidak ada transaksi untuk dihapus'
                };
            }

            await connection.beginTransaction();

            const [detailRows] = await connection.query<RowDataPacket[]>(
                'SELECT kode_barang, JMLH FROM ventra_detail_transaksi WHERE id_transaksi = ?',
                [id_transaksi]
            );

            const restoredItems: { kode: string; jumlah: number }[] = [];

            for (const detail of detailRows) {
                const kode_barang = detail.kode_barang as string;
                const jumlah = Number(detail.JMLH);

                const [updateResult] = await connection.query(
                    'UPDATE ventra_produk_detail SET stock = stock + ? WHERE Kode_Brg = ?',
                    [jumlah, kode_barang]
                );

                // Jika gagal update stok, lempar error
                if ((updateResult as any).affectedRows === 0) {
                    throw new Error(
                        `Gagal mengembalikan stok untuk kode: ${kode_barang}`
                    );
                }

                restoredItems.push({ kode: kode_barang, jumlah });
            }

            await connection.query(
                'DELETE FROM ventra_detail_transaksi WHERE id_transaksi = ?',
                [id_transaksi]
            );
            await connection.query(
                'DELETE FROM ventra_transaksi WHERE ID_Transaksi = ?',
                [id_transaksi]
            );

            await connection.commit();

            return {
                error: false,
                transaction_id: id_transaksi,
                restored_items: restoredItems
            };
        } catch (err) {
            if (connection) {
                await connection.rollback();
            }
            throw err;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
};

