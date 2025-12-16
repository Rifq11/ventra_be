"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const async_handler_1 = require("../../common/async.handler");
const products_service_1 = require("./products.service");
exports.ProductsController = {
    getProducts: (0, async_handler_1.asyncHandler)(async (req, res) => {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = parseInt(req.query.limit) || 20;
        const data = await products_service_1.ProductsService.getProducts(page, limit);
        res.json({
            status: 'success',
            message: 'Produk ditemukan',
            page,
            limit,
            data
        });
    }),
    getProductByKode: (0, async_handler_1.asyncHandler)(async (req, res) => {
        const kode = req.params.kode.trim();
        const data = await products_service_1.ProductsService.getProductByKode(kode);
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
