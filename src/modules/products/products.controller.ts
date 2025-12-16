import { Request, Response } from 'express';
import { asyncHandler } from '../../common/async.handler';
import { ProductsService } from './products.service';

export const ProductsController = {
    // GET /api/products?page=1&limit=20
    getProducts: asyncHandler(async (req: Request, res: Response) => {
        const page = Math.max(1, parseInt(req.query.page as string) || 1);
        const limit = parseInt(req.query.limit as string) || 20;

        const data = await ProductsService.getProducts(page, limit);

        res.json({
            status: 'success',
            message: 'Produk ditemukan',
            page,
            limit,
            data
        });
    }),

    // GET /api/products/:kode
    getProductByKode: asyncHandler(async (req: Request, res: Response) => {
        const kode = req.params.kode.trim();
        const data = await ProductsService.getProductByKode(kode);

        if (!data) {
            return res.status(404).json({
                status: 'not_found',
                message: 'Produk tidak ditemukan'
            });
        }

        res.json({
            status: 'success',
            message: 'Produk ditemukan',
            data: [data]
        });
    })
};
