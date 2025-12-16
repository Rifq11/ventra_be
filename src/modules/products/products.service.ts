import pool from '../../config/db';
import { RowDataPacket } from 'mysql2';
import * as fs from 'fs';
import * as path from 'path';

export const ProductsService = {
    async getProducts(page: number, limit: number) {
        const offset = (page - 1) * limit;

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                MIN(d.Kode_Brg) AS Kode_Brg,
                d.produk_id,
                MIN(d.ukuran) AS ukuran,
                MIN(d.pattern) AS pattern,
                MIN(d.barcode) AS barcode,
                SUM(d.stock) AS stock,
                p.Nama_Brg,
                p.Bahan,
                p.harga_jual,
                p.Kategori,
                p.Gambar
            FROM ventra_produk_detail d
            JOIN ventra_produk p ON d.produk_id = p.id
            GROUP BY d.produk_id
            LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        return rows.map(row => ({
            Kode_Brg: row.Kode_Brg,
            produk_id: row.produk_id,
            ukuran: row.ukuran,
            pattern: this.getPatternUrl(row.pattern, row.Kode_Brg),
            barcode: row.barcode,
            stock: row.stock,
            Nama_Brg: row.Nama_Brg,
            Bahan: row.Bahan,
            harga_jual: row.harga_jual,
            Kategori: row.Kategori,
            Gambar: this.encodeImage(row.Gambar)
        }));
    },

    async getProductByKode(kode: string) {
        const today = new Date().toISOString().split('T')[0];

        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT 
                pd.Kode_Brg,
                p.Nama_Brg,
                p.Bahan,
                p.harga_jual,
                p.Gambar,
                pd.ukuran,
                pd.pattern,
                pd.stock,
                de.id_event,
                p.id,
                p.harga_jual * e.total_diskon / 100 AS PotonganHarga,
                (p.harga_jual - (p.harga_jual * e.total_diskon / 100)) AS HargaDiskon
            FROM ventra_produk_detail pd
            JOIN ventra_produk p ON p.id = pd.produk_id
            LEFT JOIN ventra_detail_event de ON de.id_produk = pd.produk_id
            LEFT JOIN ventra_event e ON e.id_event = de.id_event 
                AND ? BETWEEN e.waktu_aktif AND e.waktu_non_aktif
            WHERE pd.Kode_Brg = ?
            LIMIT 1`,
            [today, kode]
        );

        if (rows.length === 0) return null;

        const row = rows[0];

        return {
            Kode_Brg: row.Kode_Brg,
            Nama_Brg: row.Nama_Brg,
            Bahan: row.Bahan,
            harga_jual: row.harga_jual,
            pattern: this.getPatternUrl(row.pattern, row.Kode_Brg),
            ukuran: row.ukuran,
            stock: row.stock,
            Gambar: this.encodeImage(row.Gambar),
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
        const baseUrl = process.env.BASE_URL || 'https://backend24.site/Rian/XI/recode/Ventra';

        if (pattern) {
            return pattern;
        }

        // Try to find pattern file
        const patternFolder = path.join(__dirname, '../../../public/uploads/patterns/');
        try {
            const files = fs.readdirSync(patternFolder);
            const matchedFile = files.find(file =>
                file.includes(kode) && (file.endsWith('.png') || file.endsWith('.jpg'))
            );

            if (matchedFile) {
                return `${baseUrl}/uploads/patterns/${matchedFile}`;
            }
        } catch (err) {
            // Folder doesn't exist or error reading
        }

        return null;
    }
};
