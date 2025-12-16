"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombinationsService = void 0;
const drizzle_1 = __importDefault(require("../../config/drizzle"));
const schema_1 = require("../../drizzle/schema");
const drizzle_orm_1 = require("drizzle-orm");
const path = __importStar(require("path"));
exports.CombinationsService = {
    extractPatternFilename(pattern) {
        if (!pattern)
            return null;
        if (pattern.includes('/')) {
            const parts = pattern.split('/');
            return parts[parts.length - 1];
        }
        return pattern;
    },
    async getCombinationsByProductId(produkId) {
        const rows = await drizzle_1.default
            .select({
            ukuran: schema_1.ventraProdukDetail.ukuran,
            pattern: schema_1.ventraProdukDetail.pattern,
            Kode_Brg: schema_1.ventraProdukDetail.kodeBrg,
        })
            .from(schema_1.ventraProdukDetail)
            .where((0, drizzle_orm_1.eq)(schema_1.ventraProdukDetail.produkId, produkId));
        return rows.map(row => {
            return {
                ukuran: row.ukuran || '',
                Kode_Brg: row.Kode_Brg,
                pattern: this.extractPatternFilename(row.pattern)
            };
        });
    },
    async saveCombinationPattern(params) {
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
        await drizzle_1.default.insert(schema_1.ventraProdukDetail).values({
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
