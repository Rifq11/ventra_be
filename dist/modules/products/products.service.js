"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const drizzle_1 = __importDefault(require("../../config/drizzle"));
const schema_1 = require("../../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
exports.ProductsService = {
    async getProducts(page, limit) {
        const offset = (page - 1) * limit;
        const rows = await drizzle_1.default
            .select({
            Kode_Brg: (0, drizzle_orm_1.min)(schema_1.ventraProdukDetail.kodeBrg).as('Kode_Brg'),
            produk_id: schema_1.ventraProdukDetail.produkId,
            ukuran: (0, drizzle_orm_1.min)(schema_1.ventraProdukDetail.ukuran).as('ukuran'),
            pattern: (0, drizzle_orm_1.min)(schema_1.ventraProdukDetail.pattern).as('pattern'),
            barcode: (0, drizzle_orm_1.min)(schema_1.ventraProdukDetail.barcode).as('barcode'),
            stock: (0, drizzle_orm_1.sum)(schema_1.ventraProdukDetail.stock).as('stock'),
            Nama_Brg: schema_1.ventraProduk.namaBrg,
            Bahan: schema_1.ventraProduk.bahan,
            harga_jual: schema_1.ventraProduk.hargaJual,
            Kategori: schema_1.ventraProduk.kategori,
            Gambar: schema_1.ventraProduk.gambar,
        })
            .from(schema_1.ventraProdukDetail)
            .innerJoin(schema_1.ventraProduk, (0, drizzle_orm_1.eq)(schema_1.ventraProdukDetail.produkId, schema_1.ventraProduk.id))
            .groupBy(schema_1.ventraProdukDetail.produkId)
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
            Gambar: this.encodeImage(row.Gambar)
        }));
    },
    async getProductByKode(kode) {
        const today = new Date().toISOString().split('T')[0];
        const rows = await drizzle_1.default
            .select({
            Kode_Brg: schema_1.ventraProdukDetail.kodeBrg,
            Nama_Brg: schema_1.ventraProduk.namaBrg,
            Bahan: schema_1.ventraProduk.bahan,
            harga_jual: schema_1.ventraProduk.hargaJual,
            Gambar: schema_1.ventraProduk.gambar,
            ukuran: schema_1.ventraProdukDetail.ukuran,
            pattern: schema_1.ventraProdukDetail.pattern,
            stock: schema_1.ventraProdukDetail.stock,
            id_event: schema_1.ventraDetailEvent.idEvent,
            id: schema_1.ventraProduk.id,
            PotonganHarga: (0, drizzle_orm_1.sql) `COALESCE(${schema_1.ventraProduk.hargaJual} * COALESCE(${schema_1.ventraEvent.totalDiskon}, 0) / 100, 0)`.as('PotonganHarga'),
            HargaDiskon: (0, drizzle_orm_1.sql) `(${schema_1.ventraProduk.hargaJual} - (${schema_1.ventraProduk.hargaJual} * COALESCE(${schema_1.ventraEvent.totalDiskon}, 0) / 100))`.as('HargaDiskon'),
        })
            .from(schema_1.ventraProdukDetail)
            .innerJoin(schema_1.ventraProduk, (0, drizzle_orm_1.eq)(schema_1.ventraProdukDetail.produkId, schema_1.ventraProduk.id))
            .leftJoin(schema_1.ventraDetailEvent, (0, drizzle_orm_1.eq)(schema_1.ventraProdukDetail.produkId, schema_1.ventraDetailEvent.idProduk))
            .leftJoin(schema_1.ventraEvent, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.ventraDetailEvent.idEvent, schema_1.ventraEvent.idEvent), (0, drizzle_orm_1.sql) `${drizzle_orm_1.sql.raw(`'${today}'`)} BETWEEN ${schema_1.ventraEvent.waktuAktif} AND ${schema_1.ventraEvent.waktuNonAktif}`))
            .where((0, drizzle_orm_1.eq)(schema_1.ventraProdukDetail.kodeBrg, kode))
            .limit(1);
        if (rows.length === 0)
            return null;
        const row = rows[0];
        return {
            Kode_Brg: row.Kode_Brg,
            Nama_Brg: row.Nama_Brg,
            Bahan: row.Bahan,
            harga_jual: row.harga_jual,
            pattern: this.getPatternUrl(row.pattern, row.Kode_Brg),
            ukuran: row.ukuran || '',
            stock: row.stock || 0,
            Gambar: this.encodeImage(row.Gambar),
            hargaDiskon: row.HargaDiskon || null,
            potonganHarga: row.PotonganHarga || null
        };
    },
    encodeImage(imageBuffer) {
        if (!imageBuffer)
            return null;
        if (typeof imageBuffer === 'string' && imageBuffer.startsWith('data:image')) {
            return imageBuffer;
        }
        return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    },
    getPatternUrl(pattern, kode) {
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
