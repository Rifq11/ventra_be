import { Request, Response } from 'express';
import { CombinationsService } from './combinations.service';

export const CombinationsController = {
    async getByProductId(req: Request, res: Response) {
        const produkId = parseInt(req.query.produk_id as string, 10);

        if (!produkId || produkId <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'ID produk tidak valid'
            });
        }

        const data = await CombinationsService.getCombinationsByProductId(
            produkId
        );

        res.json({
            status: data.length === 0 ? 'not_found' : 'success',
            message:
                data.length === 0
                    ? 'Tidak ada kombinasi ditemukan untuk produk ini'
                    : 'Data kombinasi ditemukan',
            data
        });
    },

    async uploadPattern(req: Request, res: Response) {
        const file = (req as any).file as Express.Multer.File | undefined;
        const { produk_id, ukuran, kode_brg, stock } = req.body;

        if (!file || !produk_id || !ukuran || !kode_brg || !stock) {
            return res.status(400).json({
                status: 'error',
                message: 'Parameter wajib tidak lengkap'
            });
        }

        const result = await CombinationsService.saveCombinationPattern({
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


