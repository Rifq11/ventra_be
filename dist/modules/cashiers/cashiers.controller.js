"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashiersController = void 0;
const cashiers_service_1 = require("./cashiers.service");
const async_handler_1 = require("../../common/async.handler");
exports.CashiersController = {
    getAllCashiers: (0, async_handler_1.asyncHandler)(async (req, res) => {
        const cashiers = await cashiers_service_1.CashiersService.getAllCashiers();
        res.json(cashiers);
    }),
    getActiveCashiers: (0, async_handler_1.asyncHandler)(async (req, res) => {
        const cashiers = await cashiers_service_1.CashiersService.getActiveCashiers();
        res.json({
            status: 'success',
            message: 'Data kasir aktif ditemukan',
            data: cashiers
        });
    }),
    getCashierByKode: (0, async_handler_1.asyncHandler)(async (req, res) => {
        const kode = parseInt(req.params.kode);
        if (isNaN(kode)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid kode_kasir'
            });
        }
        const cashier = await cashiers_service_1.CashiersService.getCashierByKode(kode);
        if (!cashier) {
            return res.status(404).json({
                status: 'not_found',
                message: 'Kasir tidak ditemukan'
            });
        }
        res.json({
            status: 'success',
            message: 'Kasir ditemukan',
            data: cashier
        });
    })
};
