import db from '../../config/drizzle';
import { ventraProdukDetail } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import * as path from 'path';

export interface CombinationItem {
    ukuran: string;
    Kode_Brg: string;
    pattern: string | null;
}

export const CombinationsService = {
    extractPatternFilename(pattern: string | null): string | null {
        if (!pattern) return null;
        
        if (pattern.includes('/')) {
            const parts = pattern.split('/');
            return parts[parts.length - 1];
        }
        
        return pattern;
    },

    async getCombinationsByProductId(produkId: number): Promise<CombinationItem[]> {
        const rows = await db
            .select({
                ukuran: ventraProdukDetail.ukuran,
                pattern: ventraProdukDetail.pattern,
                Kode_Brg: ventraProdukDetail.kodeBrg,
            })
            .from(ventraProdukDetail)
            .where(eq(ventraProdukDetail.produkId, produkId));

        return rows.map(row => {
            return {
                ukuran: row.ukuran || '',
                Kode_Brg: row.Kode_Brg,
                pattern: this.extractPatternFilename(row.pattern)
            };
        });
    },

    async saveCombinationPattern(params: {
        produk_id: number;
        ukuran: string;
        kode_brg: string;
        stock: number;
        originalFileName: string;
        buffer: Buffer;
    }) {
        // Kode lama untuk menyimpan file ke filesystem - tidak digunakan lagi karena pakai BLOB dari DB
        // const uploadDir = path.join(
        //     __dirname,
        //     '../../../public/uploads/patterns/'
        // );
        // if (!fs.existsSync(uploadDir)) {
        //     fs.mkdirSync(uploadDir, { recursive: true });
        // }
        // const fileExtension = path.extname(params.originalFileName);
        // const baseName = path.basename(params.originalFileName, fileExtension);
        // const patternFileName = `${params.kode_brg}.${baseName}${fileExtension}`;
        // const targetPath = path.join(uploadDir, patternFileName);
        // fs.writeFileSync(targetPath, params.buffer);

        // Simpan hanya filename ke database (pattern sekarang disimpan sebagai BLOB di tabel lain)
        const fileExtension = path.extname(params.originalFileName);
        const baseName = path.basename(params.originalFileName, fileExtension);
        const patternFileName = `${params.kode_brg}.${baseName}${fileExtension}`;

        await db.insert(ventraProdukDetail).values({
            produkId: params.produk_id,
            ukuran: params.ukuran,
            pattern: patternFileName,
            kodeBrg: params.kode_brg,
            stock: params.stock,
        });

        return {
            pattern: patternFileName,
            produk_id: params.produk_id,
            ukuran: params.ukuran,
            kode_brg: params.kode_brg,
            stock: params.stock
        };
    }
};
