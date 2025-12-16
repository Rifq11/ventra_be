import { Request, Response } from 'express';
import { CashiersService } from './cashiers.service';
import { asyncHandler } from '../../common/async.handler';

export const CashiersController = {
    getAllCashiers: asyncHandler(async (req: Request, res: Response) => {
        const cashiers = await CashiersService.getAllCashiers();
        res.json(cashiers);
    }),

    getActiveCashiers: asyncHandler(async (req: Request, res: Response) => {
        const cashiers = await CashiersService.getActiveCashiers();
        res.json({
            status: 'success',
            message: 'Data kasir aktif ditemukan',
            data: cashiers
        });
    }),

    getCashierByKode: asyncHandler(async (req: Request, res: Response) => {
        const kode = parseInt(req.params.kode);

        if (isNaN(kode)) {
            return res.status(400).json({
                status: 'error',
                message: 'Invalid kode_kasir'
            });
        }

        const cashier = await CashiersService.getCashierByKode(kode);

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
