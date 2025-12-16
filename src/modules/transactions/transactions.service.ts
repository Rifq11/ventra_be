import db from '../../config/drizzle';
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

        return await db.transaction(async (tx) => {
            const uangDibayar =
                payload.uang_dibayar && !Number.isNaN(payload.uang_dibayar)
                    ? payload.uang_dibayar
                    : payload.total;

            const [insertResult] = await tx.insert(ventraTransaksi).values({
                total: payload.total,
                payment: payload.payment,
                kasir: payload.kasir,
                uangDibayar: uangDibayar,
                noRek: payload.no_rek || '',
            });

            const nextId = (insertResult as any).insertId;

            for (const item of payload.detail) {
                if (
                    Number.isNaN(item.jumlah) ||
                    Number.isNaN(item.harga)
                ) {
                    throw new Error(
                        `Jumlah atau harga tidak valid pada item: ${item.kode_barang}`
                    );
                }

                // Use SELECT FOR UPDATE to lock row and prevent race condition
                const stockResult = await tx.execute(
                    sql`SELECT stock FROM ventra_produk_detail WHERE Kode_Brg = ${item.kode_barang} FOR UPDATE`
                ) as any;

                const stokSebelum = stockResult[0]?.[0]?.stock ? Number(stockResult[0][0].stock) : 0;
                
                if (stokSebelum < item.jumlah) {
                    throw new Error(
                        `Stock tidak cukup untuk ${item.kode_barang}. Stock tersedia: ${stokSebelum}, dibutuhkan: ${item.jumlah}`
                    );
                }

                const sisaStok = stokSebelum - item.jumlah;

                await tx
                    .update(ventraProdukDetail)
                    .set({ stock: sisaStok })
                    .where(eq(ventraProdukDetail.kodeBrg, item.kode_barang));

                // Check if detail already exists to prevent duplicate insert
                const existingDetail = await tx
                    .select()
                    .from(ventraDetailTransaksi)
                    .where(
                        and(
                            eq(ventraDetailTransaksi.idTransaksi, String(nextId)),
                            eq(ventraDetailTransaksi.kodeBarang, item.kode_barang)
                        )
                    )
                    .limit(1);

                if (existingDetail.length === 0) {
                    await tx.insert(ventraDetailTransaksi).values({
                        idTransaksi: String(nextId),
                        kodeBarang: item.kode_barang,
                        jumlah: item.jumlah,
                        harga: item.harga,
                        totalHarga: item.total_harga,
                        sisa: sisaStok,
                    });
                }
            }

            return {
                id: nextId
            };
        });
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
