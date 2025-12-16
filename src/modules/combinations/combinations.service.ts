import pool from '../../config/db';
import { RowDataPacket } from 'mysql2';
import * as fs from 'fs';
import * as path from 'path';

export interface CombinationItem {
    ukuran: string;
    Kode_Brg: string;
    pattern: string | null;
}

export const CombinationsService = {
    async getCombinationsByProductId(produkId: number): Promise<CombinationItem[]> {
        const [rows] = await pool.query<RowDataPacket[]>(
            `SELECT ukuran, pattern, Kode_Brg 
             FROM ventra_produk_detail 
             WHERE produk_id = ?`,
            [produkId]
        );

        const baseUrl =
            process.env.BASE_URL || 'https://backend24.site/Rian/XI/recode/Ventra';
        const patternFolder = path.join(
            __dirname,
            '../../../public/uploads/patterns/'
        );

        return rows.map(row => {
            const kode: string = row.Kode_Brg;
            let patternUrl: string | null = null;

            if (row.pattern) {
                const pattern: string = row.pattern;
                if (pattern.startsWith('http')) {
                    patternUrl = pattern;
                } else {
                    patternUrl = `${baseUrl}/uploads/patterns/${pattern}`;
                }
            } else {
                try {
                    const files = fs.readdirSync(patternFolder);
                    const matchedFile = files.find(
                        file =>
                            file.includes(kode) &&
                            (file.endsWith('.jpg') || file.endsWith('.png'))
                    );
                    if (matchedFile) {
                        patternUrl = `${baseUrl}/uploads/patterns/${matchedFile}`;
                    }
                } catch {
                    patternUrl = null;
                }
            }

            return {
                ukuran: row.ukuran,
                Kode_Brg: row.Kode_Brg,
                pattern: patternUrl
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
        const uploadDir = path.join(
            __dirname,
            '../../../public/uploads/patterns/'
        );

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const uniqueName = `${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 8)}_${params.originalFileName}`;
        const targetPath = path.join(uploadDir, uniqueName);

        fs.writeFileSync(targetPath, params.buffer);

        const baseUrl =
            process.env.BASE_URL || 'https://backend24.site/Rian/XI/recode/Ventra';
        const patternUrl = `${baseUrl}/uploads/patterns/${uniqueName}`;

        await pool.query(
            `INSERT INTO ventra_produk_detail (produk_id, ukuran, pattern, Kode_Brg, stock)
             VALUES (?, ?, ?, ?, ?)`,
            [
                params.produk_id,
                params.ukuran,
                patternUrl,
                params.kode_brg,
                params.stock
            ]
        );

        return {
            pattern_url: patternUrl,
            produk_id: params.produk_id,
            ukuran: params.ukuran,
            kode_brg: params.kode_brg,
            stock: params.stock
        };
    }
};


