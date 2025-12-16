import db from '../../config/drizzle';
import { 
    ventraProduk, 
    ventraProdukDetail,
    ventraDetailEvent,
    ventraEvent
} from '../../drizzle/schema';
import { eq, sql, and, gte, lte, desc, min, sum } from 'drizzle-orm';

export const ProductsService = {
    async getProducts(page: number, limit: number) {
        const offset = (page - 1) * limit;

        const rows = await db
            .select({
                Kode_Brg: min(ventraProdukDetail.kodeBrg).as('Kode_Brg'),
                produk_id: ventraProdukDetail.produkId,
                ukuran: min(ventraProdukDetail.ukuran).as('ukuran'),
                pattern: min(ventraProdukDetail.pattern).as('pattern'),
                barcode: min(ventraProdukDetail.barcode).as('barcode'),
                stock: sum(ventraProdukDetail.stock).as('stock'),
                Nama_Brg: ventraProduk.namaBrg,
                Bahan: ventraProduk.bahan,
                harga_jual: ventraProduk.hargaJual,
                Kategori: ventraProduk.kategori,
                Gambar: ventraProduk.gambar,
            })
            .from(ventraProdukDetail)
            .innerJoin(ventraProduk, eq(ventraProdukDetail.produkId, ventraProduk.id))
            .groupBy(ventraProdukDetail.produkId)
            .limit(limit)
            .offset(offset);

        return rows.map(row => ({
            Kode_Brg: row.Kode_Brg || '',
            produk_id: row.produk_id || 0,
            ukuran: row.ukuran || '',
            pattern: this.getPatternUrl(row.pattern, row.Kode_Brg || ''),
            barcode: row.barcode || '',
            stock: row.stock || 0,
            Nama_Brg: row.Nama_Brg,
            Bahan: row.Bahan,
            harga_jual: row.harga_jual,
            Kategori: row.Kategori,
            Gambar: this.encodeImage(row.Gambar as Buffer | string | null)
        }));
    },

    async getProductByKode(kode: string) {
        const today = new Date().toISOString().split('T')[0];

        const rows = await db
            .select({
                Kode_Brg: ventraProdukDetail.kodeBrg,
                Nama_Brg: ventraProduk.namaBrg,
                Bahan: ventraProduk.bahan,
                harga_jual: ventraProduk.hargaJual,
                Gambar: ventraProduk.gambar,
                ukuran: ventraProdukDetail.ukuran,
                pattern: ventraProdukDetail.pattern,
                stock: ventraProdukDetail.stock,
                id_event: ventraDetailEvent.idEvent,
                id: ventraProduk.id,
                PotonganHarga: sql<number>`COALESCE(${ventraProduk.hargaJual} * COALESCE(${ventraEvent.totalDiskon}, 0) / 100, 0)`.as('PotonganHarga'),
                HargaDiskon: sql<number>`(${ventraProduk.hargaJual} - (${ventraProduk.hargaJual} * COALESCE(${ventraEvent.totalDiskon}, 0) / 100))`.as('HargaDiskon'),
            })
            .from(ventraProdukDetail)
            .innerJoin(ventraProduk, eq(ventraProdukDetail.produkId, ventraProduk.id))
            .leftJoin(ventraDetailEvent, eq(ventraProdukDetail.produkId, ventraDetailEvent.idProduk))
            .leftJoin(ventraEvent, and(
                eq(ventraDetailEvent.idEvent, ventraEvent.idEvent),
                sql`${sql.raw(`'${today}'`)} BETWEEN ${ventraEvent.waktuAktif} AND ${ventraEvent.waktuNonAktif}`
            ))
            .where(eq(ventraProdukDetail.kodeBrg, kode))
            .limit(1);

        if (rows.length === 0) return null;

        const row = rows[0];

        return {
            Kode_Brg: row.Kode_Brg,
            Nama_Brg: row.Nama_Brg,
            Bahan: row.Bahan,
            harga_jual: row.harga_jual,
            pattern: this.getPatternUrl(row.pattern, row.Kode_Brg),
            ukuran: row.ukuran || '',
            stock: row.stock || 0,
            Gambar: this.encodeImage(row.Gambar as Buffer | string | null),
            hargaDiskon: row.HargaDiskon || null,
            potonganHarga: row.PotonganHarga || null
        };
    },

    encodeImage(imageBuffer: Buffer | string | null): string | null {
        if (!imageBuffer) return null;
        if (typeof imageBuffer === 'string' && imageBuffer.startsWith('data:image')) {
            return imageBuffer;
        }
        return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    },

    getPatternUrl(pattern: string | null, kode: string): string | null {
        // blob
        if (pattern) {
            return pattern;
        }

        // Kode lama untuk membaca dari filesystem - tidak digunakan lagi karena pakai BLOB dari DB
        // const baseUrl = process.env.BASE_URL || 'https://ventra.neoroza.com/api';
        // const patternFolder = path.join(__dirname, '../../../public/uploads/patterns/');
        // try {
        //     const files = fs.readdirSync(patternFolder);
        //     const matchedFile = files.find(file =>
        //         file.includes(kode) && (file.endsWith('.png') || file.endsWith('.jpg'))
        //     );
        //     if (matchedFile) {
        //         return `${baseUrl}/uploads/patterns/${matchedFile}`;
        //     }
        // } catch (err) {
        // }

        return null;
    }
};
