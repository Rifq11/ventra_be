import { Request, Response } from 'express';
import { CashiersService } from './cashiers.service';

export const CashiersController = {
    async getAllCashiers(req: Request, res: Response) {
        try {
            const cashiers = await CashiersService.getAllCashiers();
            res.json({
                success: true,
                data: cashiers
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch cashiers',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    async getActiveCashiers(req: Request, res: Response) {
        try {
            const cashiers = await CashiersService.getActiveCashiers();
            res.json({
                success: true,
                data: cashiers
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch active cashiers',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    async getCashierByKode(req: Request, res: Response) {
        try {
            const kode = parseInt(req.params.kode);

            if (isNaN(kode)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid kode_kasir'
                });
            }

            const cashier = await CashiersService.getCashierByKode(kode);

            if (!cashier) {
                return res.status(404).json({
                    success: false,
                    message: 'Cashier not found'
                });
            }

            res.json({
                success: true,
                data: cashier
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch cashier',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
};
