"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombinationsController = void 0;
const combinations_service_1 = require("./combinations.service");
exports.CombinationsController = {
    async getByProductId(req, res) {
        const produkId = parseInt(req.params.produk_id, 10);
        if (!produkId || produkId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'ID produk tidak valid'
            });
        }
        const data = await combinations_service_1.CombinationsService.getCombinationsByProductId(produkId);
        res.json({
            status: data.length === 0 ? 'not_found' : 'success',
            message: data.length === 0
                ? 'Tidak ada kombinasi ditemukan untuk produk ini'
                : 'Data kombinasi ditemukan',
            data
        });
    },
    async uploadPattern(req, res) {
        const file = req.file;
        const { produk_id, ukuran, kode_brg, stock } = req.body;
        if (!file || !produk_id || !ukuran || !kode_brg || !stock) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter wajib tidak lengkap'
            });
        }
        const result = await combinations_service_1.CombinationsService.saveCombinationPattern({
            produk_id: parseInt(produk_id, 10),
            ukuran,
            kode_brg,
            stock: parseInt(stock, 10),
            originalFileName: file.originalname,
            buffer: file.buffer
        });
        res.json({
            status: 'success',
            message: 'Pattern berhasil diupload dan disimpan',
            data: result
        });
    }
};
